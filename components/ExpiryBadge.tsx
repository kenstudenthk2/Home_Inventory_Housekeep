import { expiryStatusOf } from "@/lib/db/inventory";

const STYLES = {
  expired: { className: "bg-red-100 text-red-800", label: "已過期" },
  expiring_soon: { className: "bg-amber-100 text-amber-800", label: "快到期" },
  ok: { className: "bg-slate-100 text-slate-600", label: "" },
} as const;

export function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return null;

  const status = expiryStatusOf(expiryDate);
  if (status === "none") return null;

  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-caption ${style.className}`}>
      {style.label && <strong>{style.label}</strong>}
      {expiryDate}
    </span>
  );
}
