import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";
import { catalogApi } from "@/lib/api/catalog";
import { safe } from "@/lib/api/safe";
import { FOOTER_QUICK_LINKS, FOOTER_SUPPORT_LINKS } from "@/lib/constants";

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 font-bold text-white">{title}</h3>
      <ul className="space-y-2 text-sm text-white/70">
        {links.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>))}
      </ul>
    </div>
  );
}

// সোশ্যাল লিংক admin panel (Settings) থেকে আসে; লিংক দেওয়া না থাকলে আইকন দেখায় না। .env এর পুরোনো লিংকও কাজ করে।
export async function Footer() {
  const info = await safe(catalogApi.shopInfo(), null);
  const s0 = info?.social ?? {};
  const socials = [
    { url: s0.facebook || SITE.facebook, icon: "facebook", label: "Facebook" },
    { url: s0.instagram || SITE.instagram, icon: "instagram", label: "Instagram" },
    { url: s0.tiktok, icon: "tiktok", label: "TikTok" },
    { url: s0.telegram, icon: "telegram", label: "Telegram" },
    { url: s0.whatsapp || (SITE.whatsapp ? `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}` : ""), icon: "whatsapp", label: "WhatsApp" },
    { url: s0.youtube || SITE.youtube, icon: "youtube", label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="mt-14 bg-navy pb-24 pt-12 text-white md:pb-10">
      <div className="container-x grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">{SITE.description}</p>
        </div>
        <Col title="কুইক লিংক" links={FOOTER_QUICK_LINKS} />
        <Col title="কাস্টমার সাপোর্ট" links={FOOTER_SUPPORT_LINKS} />
        <div>
          <h3 className="mb-3 font-bold">যোগাযোগ</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4" /><a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a></li>
            <li className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4" /><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4" />{SITE.address}</li>
          </ul>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-brand-600">
                  <Icon name={s.icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="container-x mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs text-white/60 sm:flex-row">
        <p>© {new Date().getFullYear()} {SITE.name}. সর্বস্বত্ব সংরক্ষিত।</p>
        <p>ক্যাশ অন ডেলিভারি · bKash · Nagad · কার্ড</p>
      </div>
    </footer>
  );
}
