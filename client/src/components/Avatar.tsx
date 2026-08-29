import { getAccentForId, getInitials } from '../utils/avatarColor';

export default function Avatar({
  id,
  name,
  size = 40,
}: {
  id: string;
  name: string;
  size?: number;
}) {
  const accent = getAccentForId(id);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${accent.bg}, ${accent.bg}cc)`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}