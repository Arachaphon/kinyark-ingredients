const UNIT_TRANSLATIONS: Record<string, string> = {
  cup: "ถ้วย",
  g: "กรัม",
  gram: "กรัม",
  grams: "กรัม",
  kg: "กิโลกรัม",
  kilogram: "กิโลกรัม",
  head: "หัว",
  leaf: "ใบ",
  leaves: "ใบ",
  ml: "มิลลิลิตร",
  pack: "ห่อ",
  piece: "ชิ้น",
  pieces: "ชิ้น",
  pinch: "หยิบมือ",
  seed: "เมล็ด",
  seeds: "เมล็ด",
  tablespoon: "ช้อนโต๊ะ",
  tbsp: "ช้อนโต๊ะ",
  teaspoon: "ช้อนชา",
  tsp: "ช้อนชา",
  slice: "แผ่น",
  slices: "แผ่น",
  clove: "กลีบ",
  cloves: "กลีบ",
  stalk: "ต้น",
  stalks: "ต้น",
  bottle: "ขวด",
  can: "กระป๋อง",
  box: "กล่อง",
  unit: "",
  each: "ชิ้น",
  none: "",
  "": "",
}

export function translateUnit(unit: string | null | undefined): string {
  if (!unit) return ""
  const normalized = unit.trim().toLowerCase()
  return UNIT_TRANSLATIONS[normalized] ?? normalized
}
