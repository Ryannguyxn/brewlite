"use client";

import React, {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailModal from "@/components/ProductDetailModal";
import {
  fetchProductDetailById,
  getCatalogData,
  type ProductDetailLookupResult,
} from "@/services/api.service";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Lấy ID sản phẩm từ đường dẫn URL (/products/[id])
  const { id } = use(params);
  const router = useRouter();

  // Lấy dữ liệu cấu hình chung để hiển thị Header, Footer và lớp nền mờ phía sau Modal
  const { products, categories, siteConfig } = useMemo(
    () => getCatalogData(),
    []
  );

  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE GỌI API `GET /products/:id` (LOADING / ERROR / NOT-FOUND / 200 OK)
  // ==========================================================================

  // State kiểm soát trạng thái đang tải dữ liệu từ API (Loading State)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State lưu kết quả trả về từ API `GET /products/:id` (200 OK | 400 Bad Request | 404 Not Found | 500 Error)
  const [lookupResult, setLookupResult] =
    useState<ProductDetailLookupResult | null>(null);

  // Bộ đếm giúp kích hoạt gọi lại API khi người dùng bấm nút "Thử tải lại" (Retry) ở màn hình Error
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Hàm kích hoạt tải lại dữ liệu chi tiết sản phẩm từ API
  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Gọi API `GET /products/:id` mỗi khi `id` thay đổi hoặc khi người dùng nhấn "Thử tải lại"
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    setIsLoading(true);

    fetchProductDetailById(id, abortController.signal)
      .then((result) => {
        if (!isMounted) return;
        setLookupResult(result);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted || abortController.signal.aborted) return;
        setLookupResult({
          status: 500,
          error: "Internal Server Error",
          message:
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi không xác định khi tải thông tin sản phẩm.",
        });
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id, retryTrigger]);

  // ==========================================================================
  // PHẦN 2: QUẢN LÝ THÔNG BÁO GIỎ HÀNG & ĐIỀU HƯỚNG
  // ==========================================================================

  // State hiển thị thông báo (Toast) góc dưới phải khi bấm "Thêm vào giỏ hàng" hoặc bấm vào ô "Giỏ hàng"
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hàm đóng cửa sổ chi tiết và điều hướng quay lại trang Product Gallery (/)
  const handleCloseModal = () => {
    router.push("/");
  };

  // Hàm hiển thị thông báo: "Mục giỏ hàng hiện đang trong quá trình xây dựng"
  const showCartUnderConstructionNotice = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastVisible(true);

    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  // Hàm đóng thông báo (Toast) thủ công
  const handleDismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastVisible(false);
  };

  // ==========================================================================
  // PHẦN 3: GIAO DIỆN HIỂN THỊ (LOADING -> 200 OK / 404 NOT FOUND / 400 BAD REQUEST / 500 ERROR)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface antialiased">
      {/* Đây là thanh Header điều hướng trên cùng (dùng chung với trang Product Gallery) */}
      <Header
        cartCount={0}
        onCartClick={showCartUnderConstructionNotice}
        activeNav="thuc-don"
        siteConfig={siteConfig}
      />

      <main className="w-full pt-20 bg-background min-h-screen flex-1">
        <div className="flex flex-col w-full relative">
          {/* Đây là lớp nền trang Thực đơn được làm mờ phía dưới Modal (theo đúng thiết kế Stitch) */}
          <div className="w-full max-w-[1320px] mx-auto px-margin py-space-lg filter blur-[2px] opacity-40 pointer-events-none select-none">
            {/* Thanh danh mục làm mờ phía sau */}
            <div className="flex items-center justify-between mb-space-lg">
              <div className="flex gap-space-sm flex-wrap">
                {categories.map((cat, index) => (
                  <span
                    key={cat.id}
                    className={`px-space-md py-2 rounded-full font-label-md text-label-md ${
                      index === 0
                        ? "bg-on-surface text-surface"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {cat.label}
                  </span>
                ))}
              </div>
              <div className="font-body-md text-body-md text-outline">
                Đang hiển thị {products.length} sản phẩm
              </div>
            </div>

            {/* Lưới thẻ sản phẩm làm mờ phía sau */}
            <div className="grid grid-cols-3 gap-gutter">
              {products.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm"
                >
                  <div className="h-48 w-full bg-surface-container-high rounded-lg overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                  <div className="h-6 w-3/4 bg-surface-container-high rounded" />
                  <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------------
              TRẠNG THÁI 1: LOADING STATE (ĐANG GỌI API `GET /products/:id`)
             ------------------------------------------------------------------ */}
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Đang tải chi tiết sản phẩm"
              id="product-detail-loading"
              className="fixed inset-x-0 top-20 bottom-0 z-40 flex items-center justify-center p-2 sm:p-3 bg-on-surface/50 backdrop-blur-md"
            >
              {/* Khung Skeleton 2 cột mô phỏng bố cục Modal Chi tiết sản phẩm */}
              <div className="relative w-full max-w-[760px] bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden flex flex-col animate-pulse">
                {/* Nút đóng (X) vẫn hoạt động trong lúc đang tải */}
                <button
                  aria-label="Đóng cửa sổ và quay lại thực đơn"
                  onClick={handleCloseModal}
                  className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>

                <div className="grid grid-cols-12">
                  {/* Skeleton Cột Trái (Ảnh & Flavor Notes) */}
                  <div className="col-span-12 md:col-span-5 bg-surface-container-low p-3.5 flex flex-col justify-between gap-3">
                    <div className="w-full h-[195px] rounded-lg bg-surface-container-high" />
                    <div className="bg-surface-container-lowest p-3 rounded-lg flex flex-col gap-2">
                      <div className="h-4 w-2/3 bg-surface-container-high rounded" />
                      <div className="h-3 w-full bg-surface-container rounded" />
                      <div className="h-3 w-4/5 bg-surface-container rounded" />
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        <div className="h-9 bg-surface-container rounded" />
                        <div className="h-9 bg-surface-container rounded" />
                        <div className="h-9 bg-surface-container rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-3/4 bg-surface-container-high rounded" />
                  </div>

                  {/* Skeleton Cột Phải (Tên SP, Giá, Size, Topping & Nút bấm) */}
                  <div className="col-span-12 md:col-span-7 p-4 flex flex-col justify-between gap-3 bg-surface-container-lowest">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-4 w-32 bg-surface-container rounded-full" />
                        <div className="h-6 w-3/4 bg-surface-container-high rounded" />
                        <div className="h-5 w-28 bg-surface-container-high rounded" />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-14 bg-surface-container-low rounded-lg" />
                        <div className="h-14 bg-surface-container-low rounded-lg" />
                        <div className="h-14 bg-surface-container-low rounded-lg" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="h-9 bg-surface-container-low rounded-lg" />
                        <div className="h-9 bg-surface-container-low rounded-lg" />
                        <div className="h-9 bg-surface-container-low rounded-lg" />
                      </div>

                      <div className="flex items-center justify-center gap-2 py-2 text-primary font-label-md text-label-md">
                        <span className="material-symbols-outlined text-[18px] animate-spin">
                          progress_activity
                        </span>
                        <span>Đang tải thông tin sản phẩm từ máy chủ...</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-surface-container flex items-center justify-between gap-3">
                      <div className="h-9 w-24 bg-surface-container-low rounded-lg" />
                      <div className="h-10 flex-1 bg-surface-container-high rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : lookupResult?.status === 200 ? (
            /* ----------------------------------------------------------------
               TRẠNG THÁI 2: SUCCESS STATE (200 OK — HIỂN THỊ MODAL CHI TIẾT SP)
               ---------------------------------------------------------------- */
            <ProductDetailModal
              product={lookupResult.data}
              onClose={handleCloseModal}
              onAddToCart={showCartUnderConstructionNotice}
            />
          ) : lookupResult?.status === 404 || lookupResult?.status === 400 ? (
            /* ----------------------------------------------------------------
               TRẠNG THÁI 3: NOT-FOUND (404) & BAD-REQUEST (400 UUID KHÔNG HỢP LỆ)
               ---------------------------------------------------------------- */
            <div
              role="alert"
              id="product-detail-not-found"
              className="fixed inset-x-0 top-20 bottom-0 z-40 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-md"
            >
              <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl text-center flex flex-col items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    {lookupResult.status === 400 ? "warning" : "search_off"}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container text-outline font-label-md text-label-md">
                  HTTP {lookupResult.status} • {lookupResult.error}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {lookupResult.status === 400
                    ? "Mã sản phẩm không hợp lệ"
                    : "Không tìm thấy sản phẩm"}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {lookupResult.status === 400
                    ? "Định dạng Product ID trên đường dẫn không phải là UUID hợp lệ (400 Bad Request)."
                    : "Sản phẩm bạn đang tìm không tồn tại trong hệ thống hoặc đã ngừng phục vụ (404 Not Found)."}
                </p>
                <Link
                  href="/"
                  className="mt-2 px-6 py-3 rounded-lg bg-primary hover:bg-secondary text-on-primary font-title-sm text-title-sm shadow-md transition-colors inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_back
                  </span>
                  Quay lại Thực đơn
                </Link>
              </div>
            </div>
          ) : (
            /* ----------------------------------------------------------------
               TRẠNG THÁI 4: ERROR STATE (500 SERVER ERROR HOẶC LỖI KẾT NỐI MẠNG)
               ---------------------------------------------------------------- */
            <div
              role="alert"
              id="product-detail-error"
              className="fixed inset-x-0 top-20 bottom-0 z-40 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-md"
            >
              <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl text-center flex flex-col items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    cloud_off
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container text-outline font-label-md text-label-md">
                  HTTP {lookupResult?.status ?? 500} •{" "}
                  {lookupResult?.error ?? "Internal Server Error"}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Không thể tải thông tin sản phẩm
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {lookupResult?.message ||
                    "Đã xảy ra lỗi khi kết nối tới máy chủ Backend (GET /products/:id). Vui lòng thử lại."}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
                  {/* Nút Thử tải lại (gọi lại API GET /products/:id) */}
                  <button
                    type="button"
                    onClick={handleRetry}
                    id="btn-retry-product-detail"
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-title-sm text-title-sm shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    Thử tải lại
                  </button>

                  {/* Nút Quay lại Thực đơn */}
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_back
                    </span>
                    Quay lại Thực đơn
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Đây là hộp thông báo nổi (Toast) khi nhấn "Thêm vào giỏ hàng" hoặc nhấn vào ô "Giỏ hàng" */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-[60] bg-on-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
          info
        </span>
        <span className="font-title-sm text-title-sm text-surface-container-lowest">
          Mục giỏ hàng hiện đang trong quá trình xây dựng
        </span>
        <button
          type="button"
          onClick={handleDismissToast}
          aria-label="Đóng thông báo"
          className="ml-2 p-1 rounded-lg text-surface-variant hover:text-surface-container-lowest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Đây là chân trang Footer (dùng chung với trang Product Gallery) */}
      <Footer siteConfig={siteConfig} />
    </div>
  );
}
