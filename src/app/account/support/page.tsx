import { SupportChat } from "@/components/account/SupportChat";
import { PageTitle } from "@/components/account/PageTitle";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

// সাইটের ভেতরে সরাসরি মেসেজ (অ্যাডমিন এখান থেকেই উত্তর দেয়) + অন্য যোগাযোগের মাধ্যম।
export default function SupportPage() {
  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}` : "";
  const links = [
    { href: SITE.messenger, icon: "chat", title: "Messenger এ চ্যাট করুন", sub: "আমাদের পেজে মেসেজ দিন" },
    { href: wa, icon: "chat", title: "WhatsApp", sub: SITE.whatsapp },
    { href: `tel:${SITE.phone.replace(/\s/g, "")}`, icon: "phone", title: "কল করুন", sub: SITE.phone },
    { href: `mailto:${SITE.email}`, icon: "mail", title: "ইমেইল", sub: SITE.email },
  ].filter((l) => l.href);
  return (
    <>
      <PageTitle title="সাপোর্ট" sub="যেকোনো সমস্যায় আমরা পাশে আছি।" />
      <SupportChat />
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.title}>
            <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 hover:border-brand-300">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon name={l.icon} /></span>
              <span><span className="block font-semibold">{l.title}</span><span className="text-sm text-muted">{l.sub}</span></span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
