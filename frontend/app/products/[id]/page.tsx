"use client";

import React, { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailModal from "@/components/ProductDetailModal";
import {
  getCatalogData,
  lookupProductDetailById,
} from "@/services/api.service";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Lấy ID sản phẩm từ đường dẫn URL (/products/[id])
  const { id } = use(params);
  const router = useRouter();

  // Lấy dữ liệu danh mục và sản phẩm từ mock-data dùng chung với trang Product Gallery
  const { products, categories, siteConfig } = useMemo(
    () => getCatalogData(),
    []
  );

  // Tra cứu chi tiết sản phẩm theo ID (trả về status 200, 400 hoặc 404 theo API Contract)
  const lookupResult = useMemo(() => lookupProductDetailById(id), [id]);

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

          {/* Đây là phần hiển thị Hộp thoại Chi tiết sản phẩm (nếu hợp lệ 200 OK) hoặc Bảng thông báo lỗi (400 / 404) */}
          {lookupResult.status === 200 ? (
            // Đây là Component Chi tiết sản phẩm chính
            <ProductDetailModal
              product={lookupResult.data}
              onClose={handleCloseModal}
              onAddToCart={showCartUnderConstructionNotice}
            />
          ) : (
            // Đây là khung thông báo lỗi khi URL truyền ID sai định dạng UUID (400) hoặc không tìm thấy sản phẩm (404)
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-md">
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
                    : "Sản phẩm bạn đang tìm không tồn tại hoặc đã ngừng phục vụ (404 Not Found)."}
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
