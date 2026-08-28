import {
  Archive,
  Armchair,
  BedDouble,
  BookOpen,
  Box,
  Footprints,
  Lamp,
  LayoutPanelLeft,
  Refrigerator,
  Sofa,
  Table,
  Tv,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  bed: BedDouble,
  cabinet: Archive,
  nightstand: Lamp,
  vanity: LayoutPanelLeft,
  desk: Table,
  bookshelf: BookOpen,
  sofa: Sofa,
  "tv-stand": Tv,
  "coffee-table": Table,
  "dining-table": Utensils,
  fridge: Refrigerator,
  "shoe-rack": Footprints,
  shelf: LayoutPanelLeft,
  armchair: Armchair,
  box: Box,
};

/** The list offered when a user creates a custom furniture type. */
export const ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "bed", label: "床" },
  { key: "cabinet", label: "櫃" },
  { key: "nightstand", label: "床頭櫃" },
  { key: "desk", label: "桌" },
  { key: "bookshelf", label: "書架" },
  { key: "sofa", label: "沙發" },
  { key: "tv-stand", label: "電視櫃" },
  { key: "dining-table", label: "餐桌" },
  { key: "fridge", label: "雪櫃" },
  { key: "shoe-rack", label: "鞋櫃" },
  { key: "shelf", label: "層架" },
  { key: "armchair", label: "扶手椅" },
  { key: "box", label: "儲物箱" },
];

/** An unrecognised key renders the generic box, never throws. */
export function iconComponentFor(key: string): LucideIcon {
  return ICONS[key] ?? ICONS.box;
}
