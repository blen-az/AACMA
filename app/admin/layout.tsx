import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Operations dashboard", template: "%s · AACMA admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
