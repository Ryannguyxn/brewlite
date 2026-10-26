"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthCard from "./AuthCard";

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    if (isAuthModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md my-8">
        {/* Nút đóng modal */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface-container-high/80 text-on-surface hover:bg-surface-container hover:text-primary transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          aria-label="Đóng hộp thoại đăng nhập"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <AuthCard
          initialMode={authModalMode}
          onSuccess={closeAuthModal}
          isModal
        />
      </div>
    </div>
  );
}
