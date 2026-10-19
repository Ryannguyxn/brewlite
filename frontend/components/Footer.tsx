import React from "react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="w-full bg-surface-container-low mt-space-xl shadow-[0_-1px_6px_rgba(0,0,0,0.02)]"
    >
      <div className="max-w-[1320px] mx-auto px-margin py-space-xl">
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-md text-headline-md text-primary tracking-tight">
                BrewLite
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Trải nghiệm cà phê đặc sản thủ công tuyển chọn từ nông trại Cầu
              Đất và Đắk Lắk. Mỗi tách cà phê là một câu chuyện tôn vinh giá trị
              nguyên bản.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                support_agent
              </span>
              <span className="font-label-lg text-label-lg text-on-surface">
                Hotline CSKH:
              </span>
              <span className="font-title-sm text-title-sm text-primary font-bold">
                1900 6868
              </span>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-title-sm text-on-surface">
              Hệ thống chi nhánh
            </h4>
            <ul className="space-y-2 text-on-surface-variant font-body-sm text-body-sm">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                  pin_drop
                </span>
                <span>
                  BrewLite Saigon Center: Tầng B2, 65 Lê Lợi, P. Bến Nghé, Quận
                  1, TP. HCM
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                  pin_drop
                </span>
                <span>
                  BrewLite Hồ Con Rùa: 02 Công Xã Paris, P. Bến Nghé, Quận 1,
                  TP. HCM
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                  pin_drop
                </span>
                <span>
                  BrewLite Thảo Điền: 38 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức
                </span>
              </li>
            </ul>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-title-sm text-on-surface">
              Liên kết nhanh
            </h4>
            <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <a
                className="hover:text-primary transition-colors"
                href="/"
              >
                Thực đơn đặc sản
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="/voucher"
              >
                Ưu đãi thành viên
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="#footer"
              >
                Câu chuyện hạt cà phê
              </a>
              <a className="hover:text-primary transition-colors" href="#">
                Kiểm tra đơn hàng
              </a>
              <a className="hover:text-primary transition-colors" href="#">
                Chính sách bảo mật
              </a>
              <a className="hover:text-primary transition-colors" href="#">
                Điều khoản dịch vụ
              </a>
            </div>
          </div>
        </div>

        <div className="mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            © 2025 BrewLite Specialty Coffee Co. Mọi quyền được bảo lưu.
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Thiết kế cho người yêu cà phê nguyên bản Việt Nam.
          </p>
        </div>
      </div>
    </footer>
  );
}
