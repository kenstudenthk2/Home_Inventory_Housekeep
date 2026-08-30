"use server";

import { revalidatePath } from "next/cache";
import { addDrawer, renameDrawer, deleteDrawer } from "@/lib/db/drawers";
import { getFurniture } from "@/lib/db/furniture";
import { requiredNumber, requiredText } from "@/lib/form";

export async function addDrawerAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await addDrawer(furnitureId, requiredText(formData, "name"));

  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
}

export async function renameDrawerAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await renameDrawer(id, requiredText(formData, "name"));

  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
}

export async function deleteDrawerAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await deleteDrawer(requiredNumber(formData, "id"));

  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
}
