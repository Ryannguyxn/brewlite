"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DrinkSize } from "@/mock-data";
import {
  calculateLineTotalVnd,
  calculateSizePriceVnd,
  calculateUnitPriceVnd,
  formatVnd,
  MAX_ORDER_QUANTITY,
  MAX_TOPPINGS_PER_ITEM,
  MIN_ORDER_QUANTITY,
} from "@/services/api.service";

// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU GIỎ HÀNG (API CONTRACT v2.1 & SPRINT 2)
// ============================================================================

export const MAX_CART_ITEMS = 20;
export const CART_STORAGE_KEY = "brewlite_cart_v1";

export interface CartItemTopping {
  id: string;
  name: string;
  priceVnd: number;
}

export interface CartItem {
  /** Mã định danh duy nhất cho dòng sản phẩm trong giỏ */
  id: string;
  /** UUID sản phẩm */
  productId: string;
  /** Tên hiển thị */
  productName: string;
  /** Ảnh đại diện */
  imageUrl: string;
  /** Kích cỡ: S | M | L | ONE_SIZE */
  size: DrinkSize;
  /** Hệ số kích cỡ (100, 120, 140, ...) */
  sizeMultiplierPercent: number;
  /** Giá theo size sau khi làm tròn floor */
  sizePriceVnd: number;
  /** Giá gốc niêm yết (basePriceVnd) */
  basePriceVnd: number;
  /** Danh sách topping đã chọn (tối đa 3 loại) */
  toppings: CartItemTopping[];
  /** Danh sách ID topping */
  toppingIds: string[];
  /** Số lượng món (1 đến 10) */
  quantity: number;
  /** Đơn giá 1 ly (sizePrice + tổng topping) */
  unitPriceVnd: number;
  /** Thành tiền dòng sản phẩm (unitPrice * quantity) */
  lineTotalVnd: number;
  /** Ghi chú pha chế / yêu cầu đặc biệt */
  note?: string;
  /** Chính sách kích cỡ của sản phẩm */
  sizePolicy?: "STANDARD" | "ONE_SIZE";
}

/** Dữ liệu đầu vào khi thêm món mới vào giỏ */
export interface AddToCartInput {
  productId: string;
  productName: string;
  imageUrl?: string;
  size: DrinkSize;
  sizeMultiplierPercent: number;
  basePriceVnd: number;
  toppings?: CartItemTopping[];
  toppingIds?: string[];
  quantity: number;
  note?: string;
  sizePolicy?: "STANDARD" | "ONE_SIZE";
}

/** DTO chuyển sang Checkout / Create Order API (POST /orders) theo API Contract v2.1 Mục 8.2 */
export interface CreateOrderItemDto {
  productId: string;
  size: DrinkSize;
  toppingIds: string[];
  quantity: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  couponCode?: string;
}

export interface CartContextValue {
  /** Danh sách các dòng món trong giỏ */
  items: CartItem[];
  /** Tổng số lượng ly/món (cộng dồn quantity của tất cả dòng) */
  totalQuantity: number;
  /** Tổng số dòng món khác nhau trong giỏ */
  totalLines: number;
  /** Tổng tiền tạm tính của giỏ hàng */
  subtotalVnd: number;
  /** Chuỗi tổng tiền tạm tính có format đ */
  formattedSubtotal: string;
  /** Trạng thái mở/đóng Cart Drawer */
  isCartOpen: boolean;
  /** Thông báo feedback ngắn hạn (Toast) */
  feedbackMessage: string | null;
  feedbackType: "success" | "warning" | "error" | null;
  /** Thêm món vào giỏ hàng */
  addToCart: (input: AddToCartInput) => { success: boolean; message: string };
  /** Cập nhật số lượng của dòng món */
  updateQuantity: (itemId: string, quantity: number) => void;
  /** Tăng số lượng 1 đơn vị */
  incrementQuantity: (itemId: string) => void;
  /** Giảm số lượng 1 đơn vị (nếu <= 1 thì xóa khỏi giỏ) */
  decrementQuantity: (itemId: string) => void;
  /** Xóa 1 dòng món khỏi giỏ */
  removeFromCart: (itemId: string) => void;
  /** Xóa toàn bộ giỏ hàng */
  clearCart: () => void;
  /** Mở Cart Drawer */
  openCart: () => void;
  /** Đóng Cart Drawer */
  closeCart: () => void;
  /** Đổi trạng thái mở/đóng Cart Drawer */
  toggleCart: () => void;
  /** Tắt thông báo feedback */
  dismissFeedback: () => void;
  /** Chuyển đổi giỏ hàng sang payload chuẩn bị cho POST /orders */
  mapToCreateOrderPayload: (couponCode?: string) => CreateOrderDto;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Sinh chuỗi định danh duy nhất cho dòng sản phẩm dựa trên thuộc tính
 * (Nếu cùng productId, cùng size, cùng toppingIds và cùng note thì được xem là cùng 1 món)
 */
function generateCartItemKey(
  productId: string,
  size: DrinkSize,
  toppingIds: string[],
  note?: string
): string {
  const sortedToppingKey = [...toppingIds].sort().join(",");
  const cleanNote = (note || "").trim().toLowerCase();
  return `${productId}_${size}_[${sortedToppingKey}]_${cleanNote}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "success" | "warning" | "error" | null
  >(null);

  // Khôi phục giỏ hàng từ localStorage khi khởi động (SSR Safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Bỏ qua lỗi parse và khởi tạo giỏ rỗng
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Lưu lại giỏ hàng vào localStorage mỗi khi có cập nhật
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Bỏ qua lỗi quotaExceeded
    }
  }, [items, isHydrated]);

  // Hiển thị feedback nhanh
  const showFeedback = useCallback(
    (message: string, type: "success" | "warning" | "error" = "success") => {
      setFeedbackMessage(message);
      setFeedbackType(type);
    },
    []
  );

  const dismissFeedback = useCallback(() => {
    setFeedbackMessage(null);
    setFeedbackType(null);
  }, []);

  // Tính toán tổng số lượng và tổng tiền
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalLines = items.length;

  const subtotalVnd = useMemo(() => {
    return items.reduce((sum, item) => sum + item.lineTotalVnd, 0);
  }, [items]);

  const formattedSubtotal = useMemo(() => {
    return formatVnd(subtotalVnd);
  }, [subtotalVnd]);

  // Thao tác mở/đóng drawer
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  // Thêm món vào giỏ
  const addToCart = useCallback(
    (input: AddToCartInput) => {
      // 1. Kiểm tra topping tối đa 3 loại khác nhau (API Contract v2.1 Mục 4.4 & 8.3)
      const rawToppings = input.toppings || [];
      const rawToppingIds = input.toppingIds || rawToppings.map((t) => t.id);

      // Loại bỏ topping trùng lặp nếu có
      const uniqueToppingIds = Array.from(new Set(rawToppingIds));
      if (uniqueToppingIds.length > MAX_TOPPINGS_PER_ITEM) {
        showFeedback(
          `Mỗi món chỉ được chọn tối đa ${MAX_TOPPINGS_PER_ITEM} loại topping.`,
          "warning"
        );
        return {
          success: false,
          message: `Mỗi món chỉ được chọn tối đa ${MAX_TOPPINGS_PER_ITEM} loại topping.`,
        };
      }

      // 2. Chuẩn hóa topping objects theo danh sách IDs duy nhất
      const normalizedToppings: CartItemTopping[] = [];
      for (const id of uniqueToppingIds) {
        const found = rawToppings.find((t) => t.id === id);
        if (found) {
          normalizedToppings.push({
            id: found.id,
            name: found.name,
            priceVnd: found.priceVnd,
          });
        }
      }

      // 3. Tính toán giá theo API Contract v2.1 Mục 4.5
      const sizePriceVnd = calculateSizePriceVnd(
        input.basePriceVnd,
        input.sizeMultiplierPercent
      );
      const unitPriceVnd = calculateUnitPriceVnd(
        input.basePriceVnd,
        input.sizeMultiplierPercent,
        normalizedToppings
      );

      const cleanNote = (input.note || "").trim().slice(0, 100);
      const requestedQty = Math.max(
        MIN_ORDER_QUANTITY,
        Math.min(MAX_ORDER_QUANTITY, Math.trunc(input.quantity || 1))
      );

      // Tạo key định danh dòng món
      const itemKey = generateCartItemKey(
        input.productId,
        input.size,
        uniqueToppingIds,
        cleanNote
      );

      let resultMessage = "Đã thêm món vào giỏ hàng thành công!";
      let isSuccess = true;

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) =>
            generateCartItemKey(
              item.productId,
              item.size,
              item.toppingIds,
              item.note
            ) === itemKey
        );

        if (existingIndex >= 0) {
          // Đã có món cùng thuộc tính trong giỏ -> tăng số lượng
          const current = prevItems[existingIndex];
          const newQty = current.quantity + requestedQty;

          if (newQty > MAX_ORDER_QUANTITY) {
            resultMessage = `Đã đạt giới hạn tối đa ${MAX_ORDER_QUANTITY} ly cho món này trong giỏ hàng.`;
            showFeedback(resultMessage, "warning");
            const updated = [...prevItems];
            updated[existingIndex] = {
              ...current,
              quantity: MAX_ORDER_QUANTITY,
              lineTotalVnd: calculateLineTotalVnd(
                current.unitPriceVnd,
                MAX_ORDER_QUANTITY
              ),
            };
            return updated;
          }

          const updated = [...prevItems];
          updated[existingIndex] = {
            ...current,
            quantity: newQty,
            lineTotalVnd: calculateLineTotalVnd(current.unitPriceVnd, newQty),
          };
          showFeedback(
            `Đã cập nhật số lượng: ${current.productName} (${newQty} ly)`,
            "success"
          );
          return updated;
        }

        // Chưa có -> Kiểm tra giới hạn tối đa 20 dòng món
        if (prevItems.length >= MAX_CART_ITEMS) {
          resultMessage = `Giỏ hàng chỉ có thể chứa tối đa ${MAX_CART_ITEMS} dòng món khác nhau.`;
          isSuccess = false;
          showFeedback(resultMessage, "error");
          return prevItems;
        }

        const newItem: CartItem = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          productId: input.productId,
          productName: input.productName,
          imageUrl: input.imageUrl || "/images/product-placeholder.svg",
          size: input.size,
          sizeMultiplierPercent: input.sizeMultiplierPercent,
          sizePriceVnd,
          basePriceVnd: input.basePriceVnd,
          toppings: normalizedToppings,
          toppingIds: uniqueToppingIds,
          quantity: requestedQty,
          unitPriceVnd,
          lineTotalVnd: calculateLineTotalVnd(unitPriceVnd, requestedQty),
          note: cleanNote,
          sizePolicy: input.sizePolicy,
        };

        showFeedback(`Đã thêm "${newItem.productName}" vào giỏ hàng`, "success");
        return [...prevItems, newItem];
      });

      // Tự động mở Cart Drawer để người dùng quan sát giỏ hàng
      setIsCartOpen(true);

      return {
        success: isSuccess,
        message: resultMessage,
      };
    },
    [showFeedback]
  );

  // Cập nhật số lượng của dòng món
  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      setItems((prevItems) => {
        if (newQuantity <= 0) {
          // Xóa khỏi giỏ nếu giảm về <= 0
          const itemToRemove = prevItems.find((i) => i.id === itemId);
          if (itemToRemove) {
            showFeedback(`Đã xóa ${itemToRemove.productName} khỏi giỏ hàng`);
          }
          return prevItems.filter((i) => i.id !== itemId);
        }

        const clamped = Math.min(MAX_ORDER_QUANTITY, Math.trunc(newQuantity));
        if (newQuantity > MAX_ORDER_QUANTITY) {
          showFeedback(
            `Số lượng tối đa cho mỗi dòng là ${MAX_ORDER_QUANTITY} ly.`,
            "warning"
          );
        }

        return prevItems.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: clamped,
              lineTotalVnd: calculateLineTotalVnd(item.unitPriceVnd, clamped),
            };
          }
          return item;
        });
      });
    },
    [showFeedback]
  );

  const incrementQuantity = useCallback(
    (itemId: string) => {
      setItems((prevItems) => {
        const item = prevItems.find((i) => i.id === itemId);
        if (!item) return prevItems;
        if (item.quantity >= MAX_ORDER_QUANTITY) {
          showFeedback(
            `Số lượng tối đa cho mỗi dòng là ${MAX_ORDER_QUANTITY} ly.`,
            "warning"
          );
          return prevItems;
        }
        const nextQty = item.quantity + 1;
        return prevItems.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantity: nextQty,
                lineTotalVnd: calculateLineTotalVnd(i.unitPriceVnd, nextQty),
              }
            : i
        );
      });
    },
    [showFeedback]
  );

  const decrementQuantity = useCallback(
    (itemId: string) => {
      setItems((prevItems) => {
        const item = prevItems.find((i) => i.id === itemId);
        if (!item) return prevItems;
        if (item.quantity <= 1) {
          // Giảm từ 1 sẽ xóa món khỏi giỏ
          showFeedback(`Đã xóa ${item.productName} khỏi giỏ hàng`);
          return prevItems.filter((i) => i.id !== itemId);
        }
        const nextQty = item.quantity - 1;
        return prevItems.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantity: nextQty,
                lineTotalVnd: calculateLineTotalVnd(i.unitPriceVnd, nextQty),
              }
            : i
        );
      });
    },
    [showFeedback]
  );

  // Xóa 1 dòng món khỏi giỏ
  const removeFromCart = useCallback(
    (itemId: string) => {
      setItems((prevItems) => {
        const item = prevItems.find((i) => i.id === itemId);
        if (item) {
          showFeedback(`Đã xóa "${item.productName}" khỏi giỏ hàng`);
        }
        return prevItems.filter((i) => i.id !== itemId);
      });
    },
    [showFeedback]
  );

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(() => {
    setItems([]);
    showFeedback("Đã làm rỗng giỏ hàng");
  }, [showFeedback]);

  // Chuyển đổi giỏ hàng sang định dạng CreateOrderDto theo API Contract v2.1 Mục 8.2
  const mapToCreateOrderPayload = useCallback(
    (couponCode?: string): CreateOrderDto => {
      const payloadItems: CreateOrderItemDto[] = items.map((item) => ({
        productId: item.productId,
        size: item.size,
        toppingIds: item.toppingIds,
        quantity: item.quantity,
      }));

      const cleanCoupon = couponCode?.trim();
      return {
        items: payloadItems,
        ...(cleanCoupon ? { couponCode: cleanCoupon } : {}),
      };
    },
    [items]
  );

  const value: CartContextValue = {
    items,
    totalQuantity,
    totalLines,
    subtotalVnd,
    formattedSubtotal,
    isCartOpen,
    feedbackMessage,
    feedbackType,
    addToCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    dismissFeedback,
    mapToCreateOrderPayload,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
