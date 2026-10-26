import type { Metadata } from "next";
import OrderHistoryView from "@/components/OrderHistoryView";

export const metadata: Metadata = {
  title: "Đơn hàng của tôi (/orders/me) - BrewLite Specialty Coffee",
  description:
    "Lịch sử giao dịch và chi tiết đơn hàng của thành viên BrewLite theo API Contract v3.0.",
};

export default function MyOrdersPage() {
  return <OrderHistoryView />;
}
