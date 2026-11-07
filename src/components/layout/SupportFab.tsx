import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

// ডান পাশের ভাসমান সাপোর্ট বাটন (Messenger/WhatsApp লিংক .env এ থাকলে দেখাবে)
export function SupportFab() {
  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}` : "";
  const href = SITE.messenger || wa;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="চ্যাটে যোগাযোগ করুন"
      className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 md:bottom-6">
      <Icon name="chat" className="h-6 w-6" />
    </a>
  );
}
