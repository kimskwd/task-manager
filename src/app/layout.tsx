import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "과제 관리",
  description: "대학생을 위한 간단한 과제 관리 앱",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
