import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

// about / privacy / terms ইত্যাদি সাধারণ লেখার পেজের কাঠামো
export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: title }]} />
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-5 text-3xl font-bold">{title}</h1>
        <div className="space-y-4 leading-7 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      </article>
    </>
  );
}
