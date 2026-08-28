import { iconComponentFor } from "@/lib/icons";

export function FurnitureIcon({
  iconKey,
  className = "h-5 w-5",
}: {
  iconKey: string;
  className?: string;
}) {
  const Icon = iconComponentFor(iconKey);
  return <Icon className={className} aria-hidden />;
}
