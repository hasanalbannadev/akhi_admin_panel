import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <EmptyState icon="search" title="পেজটি খুঁজে পাওয়া যায়নি"
      text="আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা ঠিকানা ভুল।"
      action={<LinkButton href="/">হোমে ফিরে যান</LinkButton>} />
  );
}
