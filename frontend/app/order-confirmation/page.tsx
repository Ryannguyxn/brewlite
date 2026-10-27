"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/services/auth.service";
import {
  type OrderConfirmationData,
  type PaymentApiResponse,
  fetchMyOrdersApi,
  findOrderForConfirmation,
  fetchAuthMeProfile,
} from "@/services/order-confirmation.service";
import { OrderSuccessView } from "@/components/OrderSuccessView";
import { PaymentFailedRetryView } from "@/components/PaymentFailedRetryView";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const initialStatusParam = searchParams.get("status");

  const { accessToken, user, isAuthenticated } = useAuth();
  const token = accessToken || (typeof window !== "undefined" ? getStoredToken() : null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [userLoyaltyPoints, setUserLoyaltyPoints] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadConfirmationOrder() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [orders, profile] = await Promise.all([
          fetchMyOrdersApi(token),
          fetchAuthMeProfile(token),
        ]);

        if (isCancelled) return;

        if (profile?.loyaltyPoints !== undefined) {
          setUserLoyaltyPoints(profile.loyaltyPoints);
        }

        const target = findOrderForConfirmation(orders, orderIdParam);
        if (!target) {
          setError("Không tìm thấy thông tin đơn hàng này trong lịch sử của bạn.");
        } else {
          setOrder(target);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
          setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để xem đơn hàng.");
        } else {
          setError(`Không thể tải thông tin đơn hàng: ${msg}`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadConfirmationOrder();

    return () => {
      isCancelled = true;
    };
  }, [token, orderIdParam]);

  // Handler khi retry payment thành công
  const handleRetrySuccess = (result: PaymentApiResponse) => {
    if (order) {
      setOrder({
        ...order,
        status: "PAID",
        pointsEarned: result.pointsEarned,
        payment: {
          id: result.paymentId,
          status: "SUCCESS",
          method: result.method,
          methodLast4: result.methodLast4,
          amountVnd: result.amountVnd,
          mockReference: result.mockReference,
          failureReason: null,
          createdAt: result.createdAt,
        },
      });
      setUserLoyaltyPoints((prev) => prev + result.pointsEarned);
    }
  };

  // 1. Chưa đăng nhập
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-sm border border-[#EFECE6] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Cần đăng nhập</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Vui lòng đăng nhập tài khoản để tra cứu và xem trạng thái xác nhận đơn hàng của bạn.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-[#70370e] text-on-primary text-sm font-semibold transition-colors"
            >
              <span>Về Trang chủ để đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Đang tải
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-on-surface-variant">
            Đang tải dữ liệu xác nhận đơn hàng...
          </p>
        </div>
      </div>
    );
  }

  // 3. Có lỗi hoặc không tìm thấy đơn
  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-sm border border-[#EFECE6] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">error</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Không tìm thấy đơn hàng</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {error || "Hệ thống chưa tìm thấy thông tin đơn hàng này trong tài khoản của bạn."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-[#70370e] text-on-primary text-sm font-semibold transition-colors"
            >
              <span>Quay lại Thực đơn</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Kiểm tra trạng thái đơn: Thành công hay Thất bại/Thử lại
  const isSuccessStatus =
    order.status === "PAID" ||
    order.status === "PREPARING" ||
    order.status === "READY" ||
    order.status === "COMPLETED" ||
    initialStatusParam === "PAID";

  if (isSuccessStatus) {
    return (
      <OrderSuccessView
        order={order}
        customerName={user?.fullName || "Quý khách"}
        userPoints={userLoyaltyPoints || order.pointsEarned}
      />
    );
  }

  // Mặc định cho PAYMENT_FAILED, CANCELLED, PENDING
  return (
    <PaymentFailedRetryView
      order={order}
      token={token}
      onRetrySuccess={handleRetrySuccess}
    />
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-on-surface-variant">
              Đang khởi tạo trang xác nhận đơn hàng...
            </p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
