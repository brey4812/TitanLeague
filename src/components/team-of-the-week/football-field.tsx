import Image from 'next/image';
import { TeamOfTheWeekPlayer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface FootballFieldProps {
  formation: {
    goalkeeper: TeamOfTheWeekPlayer[];
    defenders: TeamOfTheWeekPlayer[];
    midfielders: TeamOfTheWeekPlayer[];
    forwards: TeamOfTheWeekPlayer[];
  };
}

const PlayerCard = ({ player }: { player: TeamOfTheWeekPlayer }) => (
  <div className="relative flex flex-col items-center text-center w-20 md:w-28 group transition-transform duration-300 hover:scale-110">
    <div className="relative w-12 h-12 md:w-16 md:h-16 mb-1 drop-shadow-2xl">
      <Image
        src={player.teamLogoUrl}
        alt={player.teamName}
        width={64}
        height={64}
        className="rounded-full border-2 border-white bg-gray-200 object-cover"
        data-ai-hint={player.teamDataAiHint}
      />
    </div>
    <p className="text-xs font-bold text-white truncate w-full bg-black/50 rounded-full px-2 py-0.5 shadow-lg">{player.name}</p>
    <Badge variant="secondary" className="mt-1 text-xs">{player.position}</Badge>
  </div>
);

// Positions for a 4-3-3 formation
// [top, left] percentages for a more realistic spread
const formationPositions = {
    goalkeeper: [
        [88, 50],
    ],
    defenders: [
        [70, 20], [68, 40], [68, 60], [70, 80],
    ],
    midfielders: [
        [48, 25], [45, 50], [48, 75],
    ],
    forwards: [
        [22, 18], [18, 50], [22, 82],
    ]
};


export function FootballField({ formation }: FootballFieldProps) {
  
  const renderPlayer = (player: TeamOfTheWeekPlayer, positions: number[][], index: number) => {
    if (!player || !positions[index]) return null;
    const [top, left] = positions[index];
    return (
        <div 
            key={player.id} 
            className="absolute z-10"
            style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
        >
            <PlayerCard player={player} />
        </div>
    );
  };

  return (
    <div className="relative w-[95vw] md:w-full max-w-4xl mx-auto aspect-[2/3] md:aspect-[3/2] rounded-lg border-4 border-white/30 overflow-hidden shadow-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
        {/* Field lines using SVG for crispness */}
        <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <rect width="300" height="200" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center line */}
            <line x1="150" y1="0" x2="150" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center circle */}
            <circle cx="150" cy="100" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center spot */}
            <circle cx="150" cy="100" r="1" fill="rgba(255,255,255,0.2)" />
            {/* Home penalty area */}
            <rect x="0" y="55" width="45" height="90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Home goal area */}
            <rect x="0" y="75" width="15" height="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Away penalty area */}
            <rect x="255" y="55" width="45" height="90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
             {/* Away goal area */}
            <rect x="285" y="75" width="15" height="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      
        {/* Players */}
        <div className="absolute inset-0">
            {formation.goalkeeper.map((p, i) => renderPlayer(p, formationPositions.goalkeeper, i))}
            {formation.defenders.map((p, i) => renderPlayer(p, formationPositions.defenders, i))}
            {formation.midfielders.map((p, i) => renderPlayer(p, formationPositions.midfielders, i))}
            {formation.forwards.map((p, i) => renderPlayer(p, formationPositions.forwards, i))}
        </div>
    </div>
  );
}
