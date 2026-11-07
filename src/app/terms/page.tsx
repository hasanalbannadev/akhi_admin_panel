import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = withOg({
  title: "শর্তাবলি",
  description: "Akhi Lifestyle ব্যবহারের শর্তাবলি।",
  alternates: { canonical: "/terms" },
});

export default function Page() {
  return (
    <StaticPage title="শর্তাবলি">
      <p>এই ওয়েবসাইটে অর্ডার করার মাধ্যমে আপনি আমাদের শর্তাবলিতে সম্মত হচ্ছেন। পণ্যের দাম ও স্টক যেকোনো সময় পরিবর্তন হতে পারে। ভুল তথ্য দিলে অর্ডার বাতিল হতে পারে।</p>
    </StaticPage>
  );
}
