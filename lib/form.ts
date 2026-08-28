export function optionalText(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function optionalNumber(formData: FormData, key: string): number | null {
  const text = optionalText(formData, key);
  if (text === null) return null;
  const value = Number(text);
  if (Number.isNaN(value)) throw new Error(`${key} 必須係數字`);
  return value;
}

export function requiredText(formData: FormData, key: string): string {
  const text = optionalText(formData, key);
  if (text === null) throw new Error(`${key} 不可以為空白`);
  return text;
}

export function requiredNumber(formData: FormData, key: string): number {
  const value = optionalNumber(formData, key);
  if (value === null) throw new Error(`${key} 不可以為空白`);
  return value;
}
