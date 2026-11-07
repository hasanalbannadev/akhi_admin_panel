import type { Metadata } from "next";
import { withOg } from "@/lib/seo";
import { TrackForm } from "@/components/orders/TrackForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = withOg({
  title: "অর্ডার ট্র্যাক করুন",
  description: "অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে আপনার অর্ডারের বর্তমান অবস্থা জানুন।",
  alternates: { canonical: "/track" },
});

export default function TrackPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "অর্ডার ট্র্যাক" }]} />
      <h1 className="mb-5 text-2xl font-bold">অর্ডার ট্র্যাক করুন</h1>
      <TrackForm />
    </>
  );
}
