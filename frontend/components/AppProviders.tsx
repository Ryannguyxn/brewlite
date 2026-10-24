"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
