export type RoomType = { id: number; key: string; label: string };
export type FurnitureType = { id: number; name: string; iconKey: string };
export type Category = { id: number; name: string };

export type Room = {
  id: number;
  name: string;
  roomTypeId: number | null;
  roomTypeLabel: string | null;
  widthCm: number | null;
  lengthCm: number | null;
};

export type Furniture = {
  id: number;
  roomId: number;
  furnitureTypeId: number;
  /** The user's override, or null to fall back to the type's name. */
  customName: string | null;
  /** Resolved display name: customName ?? furniture type name. */
  displayName: string;
  iconKey: string;
};

export type Drawer = {
  id: number;
  furnitureId: number;
  name: string;
  sortOrder: number;
};

export type Item = {
  id: number;
  furnitureId: number;
  drawerId: number | null;
  drawerName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  name: string;
  quantity: number;
  /** ISO date string (YYYY-MM-DD), or null. */
  expiryDate: string | null;
};
