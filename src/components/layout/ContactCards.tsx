import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

export function ContactCards() {
  const items = [
    { icon: "phone", t: "ফোন", v: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    { icon: "mail", t: "ইমেইল", v: SITE.email, href: `mailto:${SITE.email}` },
    { icon: "pin", t: "ঠিকানা", v: SITE.address, href: "" },
    ...(SITE.messenger ? [{ icon: "chat", t: "Messenger", v: "মেসেজ দিন", href: SITE.messenger }] : []),
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => {
        const inner = (<><span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon name={i.icon} /></span><span><span className="block text-sm text-muted">{i.t}</span><span className="font-semibold">{i.v}</span></span></>);
        return <li key={i.t}>{i.href ? <a href={i.href} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 hover:border-brand-300">{inner}</a> : <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">{inner}</div>}</li>;
      })}
    </ul>
  );
}
