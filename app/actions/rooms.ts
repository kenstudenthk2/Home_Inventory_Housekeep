"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRoom, updateRoom, deleteRoom } from "@/lib/db/rooms";
import { addFurnitureToRoom } from "@/lib/db/furniture";
import { optionalNumber, requiredNumber, requiredText } from "@/lib/form";

export async function createRoomAction(formData: FormData) {
  const room = await createRoom({
    name: requiredText(formData, "name"),
    roomTypeId: optionalNumber(formData, "roomTypeId"),
    widthCm: optionalNumber(formData, "widthCm"),
    lengthCm: optionalNumber(formData, "lengthCm"),
  });

  // Every checked suggestion becomes a furniture instance in the new room.
  const checked = formData.getAll("suggestedFurnitureTypeIds").map(Number).filter(Boolean);
  for (const furnitureTypeId of checked) {
    await addFurnitureToRoom(room.id, furnitureTypeId);
  }

  revalidatePath("/");
  redirect(`/rooms/${room.id}`);
}

export async function updateRoomAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  await updateRoom(id, {
    name: requiredText(formData, "name"),
    roomTypeId: optionalNumber(formData, "roomTypeId"),
    widthCm: optionalNumber(formData, "widthCm"),
    lengthCm: optionalNumber(formData, "lengthCm"),
  });

  revalidatePath("/");
  revalidatePath(`/rooms/${id}`);
  redirect(`/rooms/${id}`);
}

export async function deleteRoomAction(formData: FormData) {
  await deleteRoom(requiredNumber(formData, "id"));
  revalidatePath("/");
  redirect("/");
}
