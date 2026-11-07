import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = withOg({
  title: "আমাদের সম্পর্কে",
  description: "Akhi Lifestyle - আপনার পছন্দের স্টাইলিশ অ্যাক্সেসরিজের অনলাইন শপ।",
  alternates: { canonical: "/about" },
});

export default function Page() {
  return (
    <StaticPage title="আমাদের সম্পর্কে">
      <p>Akhi Lifestyle একটি অনলাইন শপ, যেখানে পাবেন ব্যাগ, জুয়েলারি, বিউটি ও আরও অনেক লাইফস্টাইল পণ্য। আমাদের লক্ষ্য সাশ্রয়ী দামে মানসম্মত পণ্য আপনার দরজায় পৌঁছে দেওয়া।</p>
      <h2>কেন আমরা?</h2>
      <ul><li>অরিজিনাল ও মানসম্মত পণ্য</li><li>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</li><li>সহজ রিটার্ন ও দ্রুত সাপোর্ট</li></ul>
    </StaticPage>
  );
}
