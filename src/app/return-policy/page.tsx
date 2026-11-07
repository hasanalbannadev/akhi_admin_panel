import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = withOg({
  title: "রিটার্ন ও রিফান্ড পলিসি",
  description: "পণ্য রিটার্ন ও রিফান্ডের নিয়ম।",
  alternates: { canonical: "/return-policy" },
});

export default function Page() {
  return (
    <StaticPage title="রিটার্ন ও রিফান্ড পলিসি">
      <ul><li>ডেলিভারির পর পণ্যে সমস্যা থাকলে অ্যাকাউন্টের অর্ডার পেজ থেকে রিটার্ন অনুরোধ করুন।</li><li>পণ্য অব্যবহৃত ও আসল অবস্থায় থাকতে হবে।</li><li>অনুমোদনের পর রিফান্ড প্রক্রিয়া শুরু হয়।</li></ul>
    </StaticPage>
  );
}
