import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function EmptyState({
  icon = "box", title, text, action,
}: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-14 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-white text-brand-500 shadow-sm">
        <Icon name={icon} className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
