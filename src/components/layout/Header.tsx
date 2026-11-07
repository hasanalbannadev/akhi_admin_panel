"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { SearchBox } from "./SearchBox";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { supportApi } from "@/lib/api/support";
import type { Category } from "@/types";

// লগইন করা কাস্টমারের না-দেখা মেসেজের সংখ্যা (৮ সেকেন্ড পরপর; ট্যাব লুকানো থাকলে নয়)। চ্যাট খুললে সাথে সাথে ০।
function useSupportUnread(enabled: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) { setN(0); return; }
    let alive = true;
    const load = () => { if (!document.hidden) supportApi.unread().then((r) => alive && setN(r.count)).catch(() => {}); };
    load();
    const t = setInterval(load, 3000);
    const seen = () => setN(0);
    window.addEventListener("support-seen", seen);
    return () => { alive = false; clearInterval(t); window.removeEventListener("support-seen", seen); };
  }, [enabled]);
  return n;
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1.5 max-[359px]:-right-0.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function IconLink({ href, label, icon, badge = 0, hideSm = false }: { href: string; label: string; icon: string; badge?: number; hideSm?: boolean }) {
  return (
    <Link href={href} aria-label={label} className={`relative place-items-center rounded-full text-ink hover:bg-brand-50 h-9 w-9 max-[359px]:h-8 max-[359px]:w-8 sm:h-10 sm:w-10 ${hideSm ? "hidden sm:grid" : "grid"}`}>
      <Icon name={icon} className="h-[22px] w-[22px]" />
      <Badge n={badge} />
    </Link>
  );
}


// ডেস্কটপ: সব ক্যাটাগরি একটাই "ক্যাটাগরি" লিস্টে। যত ক্যাটাগরিই হোক টপ বার ভরে যায় না।
// হোভার বা ক্লিকে খোলে; প্রতিটি মূল ক্যাটাগরির নিচে তার সাব-ক্যাটাগরি সাজানো থাকে।
function CategoryMenu({ mains, subsOf }: { mains: Category[]; subsOf: (id: number) => Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const hover = useRef(false);   // মাউস ওপরে থাকলে ক্লিকে মেনু বন্ধ হবে না
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  if (mains.length === 0) return null;
  return (
    <li ref={ref} className="relative" onMouseEnter={() => { hover.current = true; setOpen(true); }} onMouseLeave={() => { hover.current = false; setOpen(false); }}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => (hover.current ? true : !o))}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-50 px-3.5 py-1.5 font-semibold text-brand-700 hover:bg-brand-100">
        <Icon name="menu" className="h-4 w-4" />ক্যাটাগরি<Icon name="chevron-down" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="max-h-[70vh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-lg" onClick={() => setOpen(false)}>
            <ul className="columns-2 gap-4 xl:columns-3">
              {mains.map((c) => (
                <li key={c.id} className="mb-2 break-inside-avoid">
                  <Link href={`/category/${c.slug}`} className="block rounded-lg px-2.5 py-1.5 text-sm font-bold hover:bg-brand-50 hover:text-brand-600">{c.name}</Link>
                  {subsOf(c.id).map((s) => (
                    <Link key={s.id} href={`/category/${s.slug}`} className="block break-words rounded-lg py-1 pl-5 pr-2.5 text-[13px] text-muted hover:bg-brand-50 hover:text-brand-600">{s.name}</Link>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

// মোবাইল মেনুর একটা ক্যাটাগরি: নামে ট্যাপ করলে পেজে যায়, তীরে ট্যাপ করলে সাব-ক্যাটাগরি খোলে।
function DrawerItem({ cat, subs }: { cat: Category; subs: Category[] }) {
  const [open, setOpen] = useState(false);
  const row = "block rounded-lg px-3 py-2.5 hover:bg-brand-50";
  return (
    <li>
      <div className="flex items-center">
        <Link className={`${row} min-w-0 flex-1 truncate`} href={`/category/${cat.slug}`}>{cat.name}</Link>
        {subs.length > 0 && (
          <button type="button" aria-label={`${cat.name} এর সাব-ক্যাটাগরি`} aria-expanded={open}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg hover:bg-brand-50"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
            <Icon name="chevron-down" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && subs.length > 0 && (
        <ul className="mb-1 ml-3 border-l border-line pl-2">
          {subs.map((c) => (
            <li key={c.id}><Link className="block break-words rounded-lg px-3 py-2 text-sm hover:bg-brand-50" href={`/category/${c.slug}`}>{c.name}</Link></li>
          ))}
        </ul>
      )}
    </li>
  );
}

// categories server (layout.tsx) থেকে আসে
export function Header({ categories }: { categories: Category[] }) {
  const { cart } = useCart();
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [menu, setMenu] = useState(false);
  // সব মূল ক্যাটাগরি একটাই লিস্টে। admin এর "Top bar position" শুধু ক্রম ঠিক করে (যেগুলোতে সংখ্যা দেওয়া আছে সেগুলো আগে)।
  const mains = categories.filter((c) => !c.parent_id).sort((a, b) => {
    const x = a.nav_order || 9999, y = b.nav_order || 9999;
    return x - y || a.sort_order - b.sort_order || a.id - b.id;
  });
  const subsOf = (id: number) => categories.filter((c) => c.parent_id === id);
  const top = mains;
  const unread = useSupportUnread(!!user);

  // মেনু খোলা থাকলে পেছনের পেজ স্ক্রল হবে না
  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-x flex h-14 items-center gap-1.5 sm:gap-3 lg:gap-5">
        <button className="grid h-9 w-9 max-[359px]:h-8 max-[359px]:w-8 shrink-0 place-items-center rounded-full hover:bg-brand-50 sm:h-10 sm:w-10 lg:hidden" onClick={() => setMenu(true)} aria-label="মেনু">
          <Icon name="menu" />
        </button>
        <Logo />
        {/* ডেস্কটপে মেনু লোগোর পাশেই, তাই আলাদা সারি লাগে না */}
        <nav className="hidden min-w-0 lg:block" aria-label="ক্যাটাগরি">
          <ul className="flex items-center gap-5 text-[14px] font-medium">
            <li><Link href="/" className="whitespace-nowrap hover:text-brand-600">হোম</Link></li>
            <CategoryMenu mains={mains} subsOf={subsOf} />
            <li><Link href="/shop" className="whitespace-nowrap text-brand-600 hover:underline">সব পণ্য</Link></li>
          </ul>
        </nav>
        <SearchBox big className="mx-auto hidden max-w-2xl flex-1 md:block" />
        <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1 md:ml-0">
          {user && <IconLink href="/account/support" label="মেসেজ" icon="chat" badge={unread} />}
          {user?.avatar_url ? (
            <Link href="/account" aria-label="অ্যাকাউন্ট" className="grid h-9 w-9 max-[359px]:h-8 max-[359px]:w-8 place-items-center sm:h-10 sm:w-10">
              <span className="block h-7 w-7 overflow-hidden rounded-full ring-2 ring-brand-100"><SmartImage key={user.avatar_url} src={user.avatar_url} alt="" className="h-full w-full object-cover" /></span>
            </Link>
          ) : <IconLink href={user ? "/account" : "/login"} label="অ্যাকাউন্ট" icon="user" />}
          <IconLink href="/account/wishlist" label="পছন্দের তালিকা" icon="heart" badge={ids.size} hideSm />
          <IconLink href="/cart" label="কার্ট" icon="bag" badge={cart.count} />
        </div>
      </div>

      {/* মোবাইলে সার্চ নিচের লাইনে */}
      <div className="container-x pb-2 md:hidden"><SearchBox /></div>

    </header>

    {/* মোবাইল সাইড মেনু */}
    {menu && (
      <div className="fixed inset-0 z-[60] lg:hidden">
        <div className="absolute inset-0 bg-navy/50" onClick={() => setMenu(false)} />
        <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <Logo />
            <button onClick={() => setMenu(false)} aria-label="বন্ধ করুন"><Icon name="x" /></button>
          </div>
          <ul className="space-y-1 text-[15px]" onClick={() => setMenu(false)}>
            <li><Link className="block rounded-lg px-3 py-2.5 hover:bg-brand-50" href="/">হোম</Link></li>
            <li><Link className="block rounded-lg px-3 py-2.5 hover:bg-brand-50" href="/shop">সব পণ্য</Link></li>
            {top.map((c) => <DrawerItem key={c.id} cat={c} subs={subsOf(c.id)} />)}
            <li className="my-2 border-t border-line" />
            <li><Link className="block rounded-lg px-3 py-2.5 hover:bg-brand-50" href="/track">অর্ডার ট্র্যাক করুন</Link></li>
            <li><Link className="block rounded-lg px-3 py-2.5 hover:bg-brand-50" href="/contact">যোগাযোগ</Link></li>
          </ul>
        </aside>
      </div>
    )}
    </>
  );
}
