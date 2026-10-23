"use client";

import React from "react";
import Link from "next/link";
import type { ProductListItem } from "@/mock-data";
import { FALLBACK_DRINK_IMAGE, formatVnd } from "@/services/api.service";

export type { ProductListItem as ProductItem };

interface ProductCardProps {
  /** Dữ liệu 1 đồ uống theo API Contract v2.1 (`id`, `name`, `imageUrl`, `basePriceVnd`, `isAvailable`, `category`, `description`, `rating`, `isNew`, `isBestseller`) */
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => void;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = formatVnd(product.basePriceVnd);
  const altText = product.imageAlt || product.name;

  // Lấy tên danh mục
  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : undefined;

  // Xử lý badge theo API Contract v2.1 (isBestseller / isNew) hoặc trường badge tùy chọn
  const badgeLabel = product.isBestseller
    ? "Best Seller"
    : product.isNew
    ? "Mới"
    : product.badge;

  // Xử lý rating theo API Contract v2.1:
  // "Không tạo giá trị rating giả; rating chưa có thì trả null."
  const hasRating =
    product.rating !== null &&
    product.rating !== undefined &&
    typeof product.rating === "number" &&
    product.rating > 0;
  const ratingText = hasRating ? Number(product.rating).toFixed(1) : null;

  const reviewsText =
    product.reviews || (categoryName ? categoryName : "Chuẩn vị thủ công");

  const descriptionText =
    product.description ||
    (categoryName
      ? `${categoryName} pha chế thủ công chuẩn vị nguyên bản BrewLite.`
      : "Tùy chọn kích cỡ Size S, M, L và tối đa 3 loại topping.");

  const detailHref = `/products/${product.id}`;

  // Trạng thái Hết hàng (`isAvailable === false` theo API Contract v2.1 Mục 3.4 & US-CAT-04)
  // Nhấn vào bất kỳ vị trí nào trên thẻ vẫn mở trang Product Detail (nút Thêm vào giỏ trong trang Detail sẽ bị khóa)
  if (!product.isAvailable) {
    return (
      <Link
        href={detailHref}
        aria-label={`Xem chi tiết ${product.name} (Tạm hết hàng)`}
        className="group relative rounded-xl bg-surface-container-lowest p-space-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full opacity-75 cursor-pointer"
      >
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container mb-space-md">
          <img
            className="w-full h-full object-cover filter grayscale-[40%]"
            alt={altText}
            src={product.imageUrl}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith(FALLBACK_DRINK_IMAGE)) {
                target.src = FALLBACK_DRINK_IMAGE;
              }
            }}
          />
          <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full font-label-md text-label-md bg-surface text-error font-semibold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                remove_shopping_cart
              </span>
              Hết hàng
            </span>
          </div>
        </div>
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              {hasRating ? (
                <div className="flex items-center gap-1 text-outline flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-label-md text-label-md">
                    {ratingText}
                  </span>
                </div>
              ) : (
                <span className="font-label-sm text-[12px] text-outline">
                  {categoryName || "Thủ công"}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-outline line-clamp-2 mb-2">
              {descriptionText}
            </p>
            <span className="font-body-sm text-body-sm text-outline">
              ({reviewsText})
            </span>
          </div>
          <div className="pt-space-md mt-space-sm flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-[11px] text-outline uppercase tracking-wider">
                Tạm hết
              </span>
              <span className="font-price-lg text-price-lg text-outline">
                {formattedPrice}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-lg bg-surface-container-high text-outline flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">
                block
              </span>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Trạng thái Còn hàng (`isAvailable === true` theo API Contract v2.1 Mục 3.4 & US-CAT-01)
  // Toàn bộ thẻ là một <Link> dẫn tới `/products/${product.id}`
  return (
    <Link
      href={detailHref}
      aria-label={`Xem chi tiết ${product.name}`}
      className="group relative rounded-xl bg-surface-container-lowest p-space-md shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container mb-space-md">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={altText}
          src={product.imageUrl}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith(FALLBACK_DRINK_IMAGE)) {
              target.src = FALLBACK_DRINK_IMAGE;
            }
          }}
        />
        {badgeLabel && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <span
              className={`px-2.5 py-1 rounded-full font-label-md text-label-md shadow-sm font-semibold ${
                badgeLabel === "Best Seller"
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-secondary-container text-on-secondary-container"
              }`}
            >
              {badgeLabel}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm shadow-md flex items-center justify-center gap-1.5 group-hover:bg-primary-container transition-all">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Xem chi tiết
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {hasRating ? (
              <div className="flex items-center gap-1 text-tertiary flex-shrink-0">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label-md text-label-md font-bold">
                  {ratingText}
                </span>
              </div>
            ) : (
              <span className="font-label-sm text-[12px] text-on-surface-variant">
                {categoryName || "Thủ công"}
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">
            {descriptionText}
          </p>
          <span className="font-body-sm text-body-sm text-outline">
            ({reviewsText})
          </span>
        </div>

        <div className="pt-space-md mt-space-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-body-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Giá niêm yết
            </span>
            <span className="font-price-lg text-price-lg text-primary">
              {formattedPrice}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm bg-surface-container group-hover:bg-primary group-hover:text-on-primary text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
