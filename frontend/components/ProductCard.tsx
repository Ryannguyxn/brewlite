"use client";

import React, { useRef, useState } from "react";
import type { ProductItem } from "@/mock-data";

export type { ProductItem };

interface ProductCardProps {
  product: ProductItem;
  onAddToCart?: (product: ProductItem) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const flyToCart = () => {
    if (typeof document === "undefined") return;
    const sourceEl = imgRef.current;
    const targetEl = document.getElementById("header-cart-btn");
    if (!sourceEl || !targetEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const clone = document.createElement("img");
    clone.src = product.image;
    clone.style.position = "fixed";
    clone.style.left = `${sourceRect.left + sourceRect.width / 2 - 28}px`;
    clone.style.top = `${sourceRect.top + sourceRect.height / 2 - 28}px`;
    clone.style.width = "56px";
    clone.style.height = "56px";
    clone.style.borderRadius = "9999px";
    clone.style.objectFit = "cover";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.boxShadow = "0 8px 24px rgba(138, 76, 34, 0.35)";
    clone.style.border = "2px solid #8a4c22";
    clone.style.transition =
      "all 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease-in";

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${targetRect.left + targetRect.width / 2 - 12}px`;
      clone.style.top = `${targetRect.top + targetRect.height / 2 - 12}px`;
      clone.style.width = "24px";
      clone.style.height = "24px";
      clone.style.opacity = "0.2";
      clone.style.transform = "scale(0.5)";
    });

    setTimeout(() => {
      clone.remove();
    }, 560);
  };

  const handleAdd = () => {
    if (product.outOfStock) return;
    flyToCart();
    setJustAdded(true);
    setTimeout(() => {
      onAddToCart?.(product);
    }, 420);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const formattedPrice = product.price.toLocaleString("vi-VN") + " đ";

  if (product.outOfStock) {
    return (
      <div className="group relative rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 flex flex-col h-full opacity-75">
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container mb-space-md">
          <img
            className="w-full h-full object-cover filter grayscale-[40%]"
            alt={product.imageAlt}
            src={product.image}
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
              <h3 className="font-title-md text-title-md text-on-surface">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 text-outline flex-shrink-0">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label-md text-label-md">
                  {product.rating}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-outline line-clamp-2 mb-2">
              {product.description}
            </p>
            <span className="font-body-sm text-body-sm text-outline">
              ({product.reviews})
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
            <button
              aria-label="Sản phẩm tạm hết hàng"
              className="w-9 h-9 rounded-lg bg-surface-container-high text-outline cursor-not-allowed flex items-center justify-center"
              disabled
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                block
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl bg-surface-container-lowest p-space-md shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container mb-space-md">
        <img
          ref={imgRef}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={product.imageAlt}
          src={product.image}
        />
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <span
              className={`px-2.5 py-1 rounded-full font-label-md text-label-md shadow-sm font-semibold ${
                product.badge === "Best Seller"
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-secondary-container text-on-secondary-container"
              }`}
            >
              {product.badge}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button
            onClick={handleAdd}
            className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm shadow-md flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {justAdded ? "check" : "shopping_cart"}
            </span>
            {justAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 text-tertiary flex-shrink-0">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="font-label-md text-label-md font-bold">
                {product.rating}
              </span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">
            {product.description}
          </p>
          <span className="font-body-sm text-body-sm text-outline">
            ({product.reviews})
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
          <button
            aria-label={`Thêm nhanh ${product.name}`}
            onClick={handleAdd}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
              justAdded
                ? "bg-primary text-on-primary"
                : "bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {justAdded ? "check" : "add"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
