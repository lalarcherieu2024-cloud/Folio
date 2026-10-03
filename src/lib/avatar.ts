// Profile picture helpers. A person has either an uploaded photo or a chosen colour for their initials.
export const AVATAR_COLORS = [
  { name: "Sky", bg: "#dbeafe", fg: "#1e40af" },
  { name: "Mint", bg: "#dcfce7", fg: "#166534" },
  { name: "Sand", bg: "#fef3c7", fg: "#92400e" },
  { name: "Rose", bg: "#fce7f3", fg: "#9d174d" },
  { name: "Lilac", bg: "#ede9fe", fg: "#5b21b6" },
  { name: "Peach", bg: "#ffedd5", fg: "#9a3412" },
  { name: "Aqua", bg: "#cffafe", fg: "#155e75" },
  { name: "Coral", bg: "#fee2e2", fg: "#991b1b" },
  { name: "Stone", bg: "#e4e4e7", fg: "#27272a" },
  { name: "Ink", bg: "#18181b", fg: "#fafafa" },
] as const;

export const isAvatarColor = (c: string) => AVATAR_COLORS.some((x) => x.bg === c);

export function avatarPublicUrl(path: string | null | undefined): string | null {
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
}
