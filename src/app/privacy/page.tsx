import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = withOg({
  title: "প্রাইভেসি পলিসি",
  description: "আমরা আপনার তথ্য কীভাবে সংগ্রহ ও ব্যবহার করি।",
  alternates: { canonical: "/privacy" },
});

export default function Page() {
  return (
    <StaticPage title="প্রাইভেসি পলিসি">
      <p>অর্ডার প্রক্রিয়া ও ডেলিভারির জন্য আমরা আপনার নাম, মোবাইল নম্বর ও ঠিকানা সংগ্রহ করি। এই তথ্য তৃতীয় পক্ষকে বিক্রি করা হয় না; শুধু ডেলিভারি ও পেমেন্ট সেবার জন্য প্রয়োজনে কুরিয়ার ও পেমেন্ট গেটওয়ের সাথে শেয়ার করা হতে পারে।</p>
      <h2>তথ্য মুছতে চাইলে</h2>
      <p>আপনার তথ্য মুছতে বা বদলাতে আমাদের সাথে যোগাযোগ করুন।</p>
    </StaticPage>
  );
}
