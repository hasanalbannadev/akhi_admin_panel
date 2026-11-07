"use client";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState icon="info" title="কিছু একটা সমস্যা হয়েছে"
      text="সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।"
      action={<Button onClick={reset}>আবার চেষ্টা করুন</Button>} />
  );
}
