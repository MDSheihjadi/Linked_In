const ACCENTS = [
  { hue: 'coral', bg: '#FF6552', bgSoft: '#FFE8E5' },
  { hue: 'teal', bg: '#12B3A6', bgSoft: '#DFF7F4' },
  { hue: 'amber', bg: '#FFB020', bgSoft: '#FFF3DC' },
  { hue: 'violet', bg: '#7C5CFC', bgSoft: '#ECE7FF' },
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAccentForId(id: string) {
  const index = hashString(id) % ACCENTS.length;
  return ACCENTS[index];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
