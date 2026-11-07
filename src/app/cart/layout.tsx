import type { Metadata } from "next";
export const metadata: Metadata = { title: "আমার কার্ট", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
