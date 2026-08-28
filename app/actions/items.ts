"use server";

import { revalidatePath } from "next/cache";
import { createItem, updateItem, deleteItem } from "@/lib/db/items";
import { optionalNumber, optionalText, requiredNumber, requiredText } from "@/lib/form";

function categoryFrom(formData: FormData) {
  return {
    categoryId: optionalNumber(formData, "categoryId"),
    categoryName: optionalText(formData, "categoryName"),
  };
}

export async function createItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  await createItem({
    furnitureId,
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function updateItemAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  await updateItem(id, {
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function deleteItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  await deleteItem(requiredNumber(formData, "id"));

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
