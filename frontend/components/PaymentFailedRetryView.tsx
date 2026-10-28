"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVnd, FALLBACK_DRINK_IMAGE } from "@/services/api.service";
import {
  type OrderConfirmationData,
  type PaymentMethodType,
  type PaymentApiResponse,
  computeOrderRemainingSeconds,
  formatRemainingTime,
  generateIdempotencyKey,
  isOrderExpired,
  submitRetryPaymentApi,
} from "@/services/order-confirmation.service";

interface PaymentFailedRetryViewProps {
  order: OrderConfirmationData;
  token?: string | null;
  onRetrySuccess?: (result: PaymentApiResponse) => void;
}

export function PaymentFailedRetryView({
  order,
  token,
  onRetrySuccess,
}: PaymentFailedRetryViewProps) {
  const router = useRouter();
  // Trạng thái đếm ngược 15 phút
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    computeOrderRemainingSeconds(order.expiresAt)
  );
  const [isExpiredState, setIsExpiredState] = useState<boolean>(() =>
    isOrderExpired(order)
  );

  // Form thử lại
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("CARD");
  const [cardIdentifier, setCardIdentifier] = useState<string>("1234567890121234");
  const [walletIdentifier, setWalletIdentifier] = useState<string>("0912345678");

  // Idempotency-Key & Network Uncertain State
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [isNetworkUncertain, setIsNetworkUncertain] = useState<boolean>(false);

  // Loading & error
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef<boolean>(false);

  // Cập nhật countdown mỗi giây
  useEffect(() => {
    if (isExpiredState) return;

    const interval = setInterval(() => {
      const remaining = computeOrderRemainingSeconds(order.expiresAt);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setIsExpiredState(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order.expiresAt, isExpiredState]);

  const formattedOrderId = `#BL-${order.id.slice(0, 8).toUpperCase()}`;

  // Tỷ lệ % thời gian còn lại (trên tổng 15 phút = 900s)
  const percentLeft = Math.max(0, Math.min(100, Math.round((remainingSeconds / 900) * 100)));

  // Xử lý submit thanh toán lại
  const handleRetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || isSubmitting || isExpiredState) return;

    if (!token) {
      setSubmitError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
      return;
    }

    const currentIdentifier = selectedMethod === "CARD" ? cardIdentifier : walletIdentifier;
    const cleanNumber = currentIdentifier.replace(/\s+/g, "");

    if (selectedMethod === "CARD" && cleanNumber.length !== 16) {
      setSubmitError("Vui lòng nhập số thẻ đúng 16 chữ số.");
      return;
    }
    if (selectedMethod === "WALLET" && cleanNumber.length !== 10) {
      setSubmitError("Vui lòng nhập số điện thoại ví đúng 10 chữ số.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitRetryPaymentApi({
        orderId: order.id,
        method: selectedMethod,
        identifier: cleanNumber,
        token,
        idempotencyKey: currentIdempotencyKey,
        expectedAmountVnd: order.totalVnd,
      });

      if (result.paymentStatus === "SUCCESS") {
        setIsNetworkUncertain(false);
        if (onRetrySuccess) {
          onRetrySuccess(result);
        } else {
          // Chuyển hướng sang OrderSuccessView
          router.push(`/order-confirmation?orderId=${order.id}`);
        }
      } else {
        // Giao dịch FAILED dứt khoát từ server (PAYMENT_DECLINED)
        setIsNetworkUncertain(false);
        setCurrentIdempotencyKey(generateIdempotencyKey());
        setSubmitError(
          `Giao dịch vẫn bị từ chối (${result.failureReason || "PAYMENT_DECLINED"}). Vui lòng thử phương thức khác.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetworkErr =
        err instanceof TypeError ||
        msg.includes("fetch") ||
        msg.includes("Network") ||
        msg.includes("Failed to fetch") ||
        msg.includes("PAYMENT_IN_PROGRESS");

      if (isNetworkErr) {
        // Lỗi mạng hoặc 409 PAYMENT_IN_PROGRESS: BẢO LƯU Idempotency-Key để retry an toàn
        setIsNetworkUncertain(true);
        setSubmitError(
          "Không thể kết nối đến máy chủ hoặc giao dịch đang xử lý. Idempotency-Key đã được giữ nguyên để bạn có thể thử lại an toàn."
        );
      } else if (msg === "UNAUTHORIZED" || (err as { statusCode?: number })?.statusCode === 401) {
        setIsNetworkUncertain(false);
        setSubmitError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setIsNetworkUncertain(false);
        if (msg.includes("IDEMPOTENCY_KEY_CONFLICT")) {
          setCurrentIdempotencyKey(generateIdempotencyKey());
        }
        setSubmitError(`Lỗi thanh toán: ${msg}`);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-background min-h-screen text-on-surface">
      {/* Header Bar */}
      <header className="sticky top-0 left-0 right-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-[#EFECE6]">
        <div className="h-16 max-w-[1320px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-headline-md text-[22px] text-primary font-bold tracking-tight">
              BrewLite
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">
              Specialty Coffee
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">
              location_on
            </span>
            <span>Chi nhánh: Saigon Center</span>
          </div>
        </div>
      </header>

      {/* Hero Notification Banner */}
      <section
        className={`w-full border-b border-[#EFECE6] py-8 ${
          isExpiredState || order.status === "CANCELLED"
            ? "bg-surface-container"
            : order.status === "PENDING"
            ? "bg-[#FFFBEB]"
            : "bg-[#FEF2F2]"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  isExpiredState || order.status === "CANCELLED"
                    ? "bg-surface-container-highest text-on-surface-variant border-outline-variant"
                    : order.status === "PENDING"
                    ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                    : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {isExpiredState
                    ? "schedule"
                    : order.status === "CANCELLED"
                    ? "cancel"
                    : order.status === "PENDING"
                    ? "hourglass_top"
                    : "error"}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">
                    {isExpiredState
                      ? "Đơn hàng đã hết hạn thanh toán"
                      : order.status === "PENDING"
                      ? "Đơn hàng đang chờ thanh toán"
                      : order.status === "CANCELLED"
                      ? "Đơn hàng đã bị hủy"
                      : "Thanh toán thất bại & Thử lại"}
                  </h1>
                  <span
                    id="orderStatusBadge"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isExpiredState || order.status === "CANCELLED"
                        ? "bg-surface-container-highest text-on-surface-variant border-outline-variant"
                        : order.status === "PENDING"
                        ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                        : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isExpiredState || order.status === "CANCELLED"
                          ? "bg-on-surface-variant"
                          : order.status === "PENDING"
                          ? "bg-[#D97706]"
                          : "bg-[#DC2626]"
                      }`}
                    ></span>
                    {/* Hiển thị chính xác trạng thái từ server, không tự ý gán ép CANCELLED/EXPIRED */}
                    {isExpiredState
                      ? order.status === "CANCELLED"
                        ? "CANCELLED (ĐÃ HỦY)"
                        : `${order.status} (QUÁ HẠN 15 PHÚT)`
                      : order.status === "PENDING"
                      ? "PENDING (CHỜ THANH TOÁN)"
                      : order.status === "CANCELLED"
                      ? "CANCELLED (ĐÃ HỦY)"
                      : "PAYMENT_FAILED (BỊ TỪ CHỐI)"}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                  {isExpiredState
                    ? "Thời gian giữ chỗ tồn kho (15 phút) đã kết thúc. Bạn không thể tiếp tục thanh toán cho đơn hàng này nữa."
                    : order.status === "PENDING"
                    ? "Đơn hàng của bạn đang ở trạng thái chờ thanh toán. Vui lòng chọn phương thức Thẻ hoặc Ví để hoàn tất trong thời hạn 15 phút."
                    : order.status === "CANCELLED"
                    ? "Đơn hàng này đã bị hủy trên hệ thống và tồn kho đã được hoàn trả."
                    : "Giao dịch thanh toán chưa thể hoàn tất. Đơn hàng của bạn đang được bảo lưu tạm thời, bạn có thể đổi phương thức và thử lại ngay."}
                </p>
              </div>
            </div>

            {/* Quick Metadata Box */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-[#EFECE6] flex-shrink-0">
              <div className="px-3 border-r border-[#EFECE6]/80 last:border-0">
                <span className="text-[11px] text-on-surface-variant block uppercase tracking-wider">
                  Mã đơn hàng
                </span>
                <span
                  id="orderCodeText"
                  className="font-mono text-sm font-bold text-primary tracking-tight"
                >
                  {formattedOrderId}
                </span>
              </div>
              <div className="px-3 border-r border-[#EFECE6]/80 last:border-0">
                <span className="text-[11px] text-on-surface-variant block uppercase tracking-wider">
                  Thời hạn giữ đơn
                </span>
                <span
                  id="countdown-timer"
                  className={`font-mono text-sm font-bold ${
                    isExpiredState ? "text-error" : "text-primary"
                  }`}
                >
                  {formatRemainingTime(remainingSeconds)}
                </span>
              </div>
              <div className="px-3">
                <span className="text-[11px] text-on-surface-variant block uppercase tracking-wider">
                  Tổng tiền
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatVnd(order.totalVnd)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-[1320px] mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Countdown & Expiration Notice Bar */}
        <div
          id="countdownNoticeBox"
          className="w-full bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-[#EFECE6] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isExpiredState
                  ? "bg-error-container text-on-error-container"
                  : "bg-tertiary-fixed text-tertiary"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">timer</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block">
                {isExpiredState ? "Đơn hàng đã hết hiệu lực" : "Thời gian giữ chỗ còn lại"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-on-surface">
                  {isExpiredState
                    ? "Đã quá hạn 15 phút"
                    : `Còn ${formatRemainingTime(remainingSeconds)}`}
                </span>
                {!isExpiredState && (
                  <span className="text-xs text-tertiary font-medium">
                    (Coupon &amp; tồn kho đang được giữ)
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isExpiredState && (
            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>Tiến trình giữ đơn</span>
                <span className="font-semibold">{percentLeft}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${percentLeft}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Notice/Reason banner */}
        <div
          id="orderNoticeBanner"
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isExpiredState || order.status === "CANCELLED"
              ? "bg-surface-container-high border-outline-variant/40 text-on-surface"
              : order.status === "PENDING"
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5 ${
              isExpiredState || order.status === "CANCELLED"
                ? "text-on-surface-variant"
                : order.status === "PENDING"
                ? "text-[#D97706]"
                : "text-[#DC2626]"
            }`}
          >
            {isExpiredState
              ? "timer_off"
              : order.status === "CANCELLED"
              ? "block"
              : order.status === "PENDING"
              ? "info"
              : "warning"}
          </span>
          <div className="space-y-0.5 text-xs">
            {isExpiredState ? (
              <>
                <p className="font-bold">
                  Thời hạn giữ chỗ đơn hàng đã kết thúc (15 phút)
                </p>
                <p className="leading-relaxed text-on-surface-variant">
                  Theo quy định của hệ thống, đơn hàng chỉ được giữ tối đa 15 phút kể từ lúc tạo. Vui lòng quay về thực đơn để tạo đơn hàng mới.
                </p>
              </>
            ) : order.status === "CANCELLED" ? (
              <>
                <p className="font-bold">
                  Đơn hàng đã bị hủy (CANCELLED)
                </p>
                <p className="leading-relaxed text-on-surface-variant">
                  Đơn hàng này hiện ở trạng thái đã hủy. Không thể thực hiện thanh toán tiếp.
                </p>
              </>
            ) : order.status === "PENDING" ? (
              <>
                <p className="font-bold">
                  Đơn hàng đang chờ thanh toán (PENDING)
                </p>
                <p className="leading-relaxed">
                  Đơn hàng của bạn đã được ghi nhận vào hệ thống. Vui lòng hoàn tất thanh toán trước khi thời gian giữ chỗ kết thúc.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">
                  Lý do thanh toán thất bại:{" "}
                  <span className="font-mono">
                    {order.payment?.failureReason || "PAYMENT_DECLINED (Thẻ bị từ chối)"}
                  </span>
                </p>
                <p className="leading-relaxed">
                  Hệ thống ghi nhận giao dịch không thành công. Bạn có thể kiểm tra lại thông tin thanh toán hoặc chọn phương thức khác để thử lại.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Main Grid: Left (7 cols - Retry Form), Right (5 cols - Summary) */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left: Retry Form */}
          <section className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#EFECE6] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[24px]">
                    payments
                  </span>
                  <h2 className="text-lg font-bold text-on-surface">
                    {order.status === "PENDING"
                      ? "Chọn phương thức thanh toán"
                      : "Chọn phương thức thanh toán thử lại"}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-tertiary bg-tertiary-fixed/60 px-2.5 py-1 rounded-full">
                  POST /payments
                </span>
              </div>

              {isExpiredState ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px]">block</span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">
                    Không thể thử lại cho đơn hàng này
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                    Đơn hàng đã hết hạn thanh toán và chuyển về trạng thái hủy. Tồn kho và ưu đãi đã
                    được hoàn trả để đảm bảo công bằng cho các khách hàng khác.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-primary hover:bg-[#70370e] text-on-primary text-sm font-semibold shadow transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Quay lại Thực đơn để đặt món mới</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRetrySubmit} className="space-y-5">
                  {/* Option 1: Card */}
                  <label
                    className={`block cursor-pointer rounded-xl p-4 transition-all border ${
                      selectedMethod === "CARD"
                        ? "bg-secondary-fixed/20 border-primary shadow-sm"
                        : "bg-surface-container-low border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment_method"
                          value="CARD"
                          checked={selectedMethod === "CARD"}
                          onChange={() => setSelectedMethod("CARD")}
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span className="material-symbols-outlined text-[22px] text-primary">
                          credit_card
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-on-surface">
                              Thẻ thanh toán (CARD - 16 chữ số)
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                              Khuyên dùng
                            </span>
                          </div>
                          <span className="text-xs text-on-surface-variant">
                            Hỗ trợ thẻ Visa, Mastercard, JCB mô phỏng
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedMethod === "CARD" && (
                      <div className="mt-4 pt-3 border-t border-primary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-on-surface-variant font-medium">
                            Số thẻ thanh toán (16 chữ số)
                          </span>
                          <button
                            type="button"
                            onClick={() => setCardIdentifier("1234567890121234")}
                            className="text-primary hover:underline font-bold"
                          >
                            Điền thẻ hợp lệ mẫu (..1234)
                          </button>
                        </div>
                        <input
                          id="card-input-field"
                          type="text"
                          maxLength={16}
                          value={cardIdentifier}
                          onChange={(e) => setCardIdentifier(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest font-mono text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="1234 5678 9012 1234"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                          💡 Gợi ý: Thẻ kết thúc bằng <strong className="text-error">0002</strong> sẽ
                          bị từ chối (PAYMENT_DECLINED); kết thúc khác 0002 sẽ THÀNH CÔNG.
                        </p>
                      </div>
                    )}
                  </label>

                  {/* Option 2: Wallet */}
                  <label
                    className={`block cursor-pointer rounded-xl p-4 transition-all border ${
                      selectedMethod === "WALLET"
                        ? "bg-secondary-fixed/20 border-primary shadow-sm"
                        : "bg-surface-container-low border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment_method"
                          value="WALLET"
                          checked={selectedMethod === "WALLET"}
                          onChange={() => setSelectedMethod("WALLET")}
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span className="material-symbols-outlined text-[22px] text-secondary">
                          account_balance_wallet
                        </span>
                        <div>
                          <span className="text-sm font-bold text-on-surface block">
                            Ví điện tử (WALLET - 10 chữ số)
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            Mô phỏng thanh toán ví MoMo, VNPay qua số điện thoại
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedMethod === "WALLET" && (
                      <div className="mt-4 pt-3 border-t border-primary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-on-surface-variant font-medium">
                            Số điện thoại ví (10 chữ số)
                          </span>
                          <button
                            type="button"
                            onClick={() => setWalletIdentifier("0912345678")}
                            className="text-primary hover:underline font-bold"
                          >
                            Điền SĐT ví hợp lệ (..5678)
                          </button>
                        </div>
                        <input
                          id="wallet-input-field"
                          type="text"
                          maxLength={10}
                          value={walletIdentifier}
                          onChange={(e) => setWalletIdentifier(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest font-mono text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="0912345678"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                          💡 Gợi ý: Ví kết thúc bằng <strong className="text-error">0000</strong> sẽ
                          bị từ chối; kết thúc khác 0000 sẽ THÀNH CÔNG.
                        </p>
                      </div>
                    )}
                  </label>

                  {/* Error display */}
                  {submitError && (
                    <div
                      id="retryErrorBanner"
                      className={`p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
                        isNetworkUncertain
                          ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                          : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span className="material-symbols-outlined text-[20px]">
                          {isNetworkUncertain ? "wifi_off" : "error"}
                        </span>
                        <span>
                          {isNetworkUncertain
                            ? "Trạng thái giao dịch chưa xác định (Network Uncertain)"
                            : "Lỗi thanh toán"}
                        </span>
                      </div>
                      <span id="retryErrorMessage">{submitError}</span>
                      {isNetworkUncertain && (
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-[#FDE68A]">
                          <span className="font-mono text-[11px] text-[#B45309]">
                            Idempotency-Key: {currentIdempotencyKey.slice(0, 8)}...
                          </span>
                          <button
                            type="button"
                            id="btnRetrySameKey"
                            onClick={handleRetrySubmit}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-[#70370e] text-on-primary font-bold text-xs transition-colors cursor-pointer"
                          >
                            {isSubmitting ? "Đang gửi lại..." : "Thử lại cùng Idempotency-Key"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btnSubmitRetryPayment"
                      disabled={isSubmitting || isExpiredState}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-[#70370e] text-on-primary font-bold text-sm shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSubmitting ? "sync" : order.status === "PENDING" ? "lock" : "refresh"}
                      </span>
                      <span>
                        {isSubmitting
                          ? order.status === "PENDING"
                            ? "Đang xử lý thanh toán..."
                            : "Đang xử lý thanh toán lại..."
                          : order.status === "PENDING"
                          ? `Thanh toán ngay (${formatVnd(order.totalVnd)})`
                          : `Thanh toán lại ngay (${formatVnd(order.totalVnd)})`}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Right: Order Summary Sidebar */}
          <aside className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#EFECE6] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    receipt_long
                  </span>
                  Tóm tắt đơn hàng ({order.items.length} món)
                </h3>
                <span className="text-xs text-on-surface-variant">Bao gồm VAT</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#EFECE6]/80 max-h-72 overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={FALLBACK_DRINK_IMAGE}
                        alt={item.productName}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-on-surface truncate">
                          {item.quantity}x {item.productName}
                        </h4>
                        <span className="text-sm font-bold text-on-surface flex-shrink-0">
                          {formatVnd(item.lineTotalVnd)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Size {item.size} ({item.sizeMultiplierPercent}%)
                        {item.toppings?.length > 0 &&
                          ` • +${item.toppings.map((t) => t.name).join(", ")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-[#EFECE6] space-y-2 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tạm tính (subtotalVnd)</span>
                  <span className="font-semibold text-on-surface">
                    {formatVnd(order.subtotalVnd)}
                  </span>
                </div>
                {order.discountVnd > 0 && (
                  <div className="flex justify-between text-tertiary font-semibold">
                    <span>
                      Giảm giá ({order.couponCode} -{" "}
                      <span className="px-1 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px]">
                        HELD
                      </span>
                      )
                    </span>
                    <span>-{formatVnd(order.discountVnd)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-[#EFECE6] flex justify-between items-baseline">
                  <span className="text-sm font-bold text-on-surface">Tổng thanh toán</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">
                      {formatVnd(order.totalVnd)}
                    </span>
                    <span className="block text-[11px] text-tertiary font-medium">
                      Điểm nhận: 0 (sẽ +{Math.floor(order.totalVnd / 10000)} điểm khi SUCCESS)
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon Held Notice */}
              {order.couponCode && !isExpiredState && (
                <div className="p-3 rounded-lg bg-surface-container flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                  <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0">
                    info
                  </span>
                  <span>
                    Mã ưu đãi <strong className="font-mono text-on-surface">{order.couponCode}</strong>{" "}
                    đang ở trạng thái <strong className="text-tertiary">HELD</strong> bảo lưu cho đơn hàng.
                    Nếu quá 15 phút chưa thanh toán, mã sẽ tự động nhả lại vào tài khoản.
                  </span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center justify-between px-2 text-xs">
              <Link
                href="/"
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Quay lại Thực đơn</span>
              </Link>
              <Link
                href="/orders"
                className="text-primary hover:underline transition-all flex items-center gap-1 font-semibold"
              >
                <span>Xem Lịch sử Đơn hàng</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
