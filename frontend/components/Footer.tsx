import React from "react";
import { MOCK_SITE_CONFIG, type SiteConfigData } from "@/mock-data";

interface FooterProps {
  siteConfig?: SiteConfigData;
}

export default function Footer({ siteConfig = MOCK_SITE_CONFIG }: FooterProps) {
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
                {siteConfig.brandName}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              {siteConfig.brandStory}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                support_agent
              </span>
              <span className="font-label-lg text-label-lg text-on-surface">
                Hotline CSKH:
              </span>
              <span className="font-title-sm text-title-sm text-primary font-bold">
                {siteConfig.hotline}
              </span>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-title-sm text-on-surface">
              Hệ thống chi nhánh
            </h4>
            <ul className="space-y-2 text-on-surface-variant font-body-sm text-body-sm">
              {siteConfig.branches.map((branch) => (
                <li key={branch.id} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                    pin_drop
                  </span>
                  <span>{branch.address}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-title-sm text-on-surface">
              Liên kết nhanh
            </h4>
            <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm text-on-surface-variant">
              {siteConfig.quickLinks.map((link, idx) => (
                <a
                  key={idx}
                  className="hover:text-primary transition-colors"
                  href={link.href}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {siteConfig.copyright}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {siteConfig.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
