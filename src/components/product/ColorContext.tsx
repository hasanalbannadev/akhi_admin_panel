"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProductColor } from "@/types";

// পণ্য পেজে বাছাই করা রং — গ্যালারি (ছবি বদলায়) ও BuyBox (স্টক, কার্ট) দুটোই এটা ব্যবহার করে
interface Ctx { colors: ProductColor[]; color: ProductColor | null; setColorId: (id: number) => void }
const ColorCtx = createContext<Ctx>({ colors: [], color: null, setColorId: () => {} });

export function ColorProvider({ colors, children }: { colors: ProductColor[]; children: ReactNode }) {
  // শুরুতে কোনো রং বাছা থাকে না: পণ্যের নিজের মূল ছবি দেখায়। রং চাপলে সেই রঙের ছবি বড় ছবি হয়।
  const [colorId, setColorId] = useState<number | null>(null);
  const value = useMemo<Ctx>(
    () => ({ colors, color: colors.find((c) => c.id === colorId) ?? null, setColorId }),
    [colors, colorId],
  );
  return <ColorCtx.Provider value={value}>{children}</ColorCtx.Provider>;
}

export const useColor = () => useContext(ColorCtx);
