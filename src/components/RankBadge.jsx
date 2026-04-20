import { getRank } from '../utils/constants';
import useStore from '../store/useStore';

export default function RankBadge({ mmr }) {
  const settings = useStore(s => s.settings);
  const rank = getRank(mmr, settings?.ranks);
  
  return (
    <span className={`rank-badge rank-${rank.key}`}>
      <span className="rank-dot" style={{ backgroundColor: rank.color }}></span>
      {rank.name}
    </span>
  );
}
