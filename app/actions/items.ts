"use server";

import { revalidatePath } from "next/cache";
import { createItem, updateItem, deleteItem, moveItemLocation } from "@/lib/db/items";
import { getFurniture, findOrCreateUnassignedFurniture } from "@/lib/db/furniture";
import { optionalNumber, optionalText, requiredNumber, requiredText } from "@/lib/form";

function categoryFrom(formData: FormData) {
  return {
    categoryId: optionalNumber(formData, "categoryId"),
    categoryName: optionalText(formData, "categoryName"),
  };
}

/** LocationPicker 揀「未定位置」嗰陣,`furnitureId` 欄位會係字串 "unassigned" 而唔係數字。 */
async function resolveFurnitureId(formData: FormData): Promise<number> {
  if (formData.get("furnitureId") === "unassigned") {
    return (await findOrCreateUnassignedFurniture()).id;
  }
  return requiredNumber(formData, "furnitureId");
}

export async function createItemAction(formData: FormData) {
  const furnitureId = await resolveFurnitureId(formData);
  const furniture = await getFurniture(furnitureId);
  await createItem({
    furnitureId,
    drawerId: optionalNumber(formData, "drawerId"),
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function updateItemAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await updateItem(id, furnitureId, {
    drawerId: optionalNumber(formData, "drawerId"),
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function updateItemLocationAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const previousFurnitureId = requiredNumber(formData, "currentFurnitureId");
  const newFurnitureId = await resolveFurnitureId(formData);

  await moveItemLocation(id, newFurnitureId, optionalNumber(formData, "drawerId"));

  const [previousFurniture, newFurniture] = await Promise.all([
    getFurniture(previousFurnitureId),
    getFurniture(newFurnitureId),
  ]);

  revalidatePath(`/furniture/${previousFurnitureId}`);
  revalidatePath(`/furniture/${newFurnitureId}`);
  if (previousFurniture) revalidatePath(`/rooms/${previousFurniture.roomId}`);
  if (newFurniture) revalidatePath(`/rooms/${newFurniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function deleteItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await deleteItem(requiredNumber(formData, "id"));

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
