"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { catalogApi } from "@/lib/api/catalog";
import { errorMessage } from "@/lib/errors";
import { DISTRICTS } from "@/lib/districts";
import { taka } from "@/lib/format";

// জেলা বাছাই করলে GET /delivery/fee থেকে ডেলিভারি চার্জ দেখায়
export function DeliveryChecker({ price }: { price: number }) {
  const [district, setDistrict] = useState("Dhaka");
  const [res, setRes] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      const r = await catalogApi.deliveryFee(district, price);
      setRes(r.fee === 0 ? `${district} এ ডেলিভারি ফ্রি` : `${district} এ ডেলিভারি চার্জ ${taka(r.fee)}`);
    } catch (e) { setRes(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-line p-4">
      <p className="mb-2 font-semibold">আপনার জেলায় ডেলিভারি চার্জ জানুন</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select aria-label="জেলা" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <Button variant="outline" loading={busy} onClick={check}>চেক করুন</Button>
      </div>
      {res && <p className="mt-2 text-sm font-medium text-brand-600">{res}</p>}
    </div>
  );
}
