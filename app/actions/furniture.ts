"use server";

import { revalidatePath } from "next/cache";
import { addFurnitureToRoom, addFurnitureByName, getFurniture, deleteFurniture } from "@/lib/db/furniture";
import { optionalNumber, optionalText, requiredNumber } from "@/lib/form";

export async function addFurnitureAction(formData: FormData) {
  const roomId = requiredNumber(formData, "roomId");
  const typeId = optionalNumber(formData, "furnitureTypeId");
  const typeName = optionalText(formData, "furnitureTypeName");
  const iconKey = optionalText(formData, "iconKey") ?? "box";
  const customName = optionalText(formData, "customName");

  if (typeId !== null) {
    await addFurnitureToRoom(roomId, typeId, customName);
  } else if (typeName !== null) {
    await addFurnitureByName(roomId, typeName, iconKey);
  } else {
    throw new Error("請揀一個傢俬類型,或者輸入一個新名稱");
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/");
}

export async function deleteFurnitureAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furniture = await getFurniture(id);
  await deleteFurniture(id);

  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/");
}
