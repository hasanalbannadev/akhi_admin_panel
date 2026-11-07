import type { Metadata } from "next";
export const metadata: Metadata = { title: "অর্ডারের বিস্তারিত", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
