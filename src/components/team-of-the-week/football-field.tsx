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
  <div className="relative flex flex-col items-center text-center w-20 md:w-24 group transition-transform duration-300 hover:scale-110 drop-shadow-2xl">
    <div className="relative w-12 h-12 md:w-16 md:h-16">
      <Image
        src={player.teamLogoUrl}
        alt={player.teamName}
        width={64}
        height={64}
        className="rounded-full border-2 border-white bg-gray-200 object-cover"
        data-ai-hint={player.teamDataAiHint}
      />
    </div>
    <div
      className="mt-1 w-full flex flex-col items-center justify-center text-white text-xs font-bold"
    >
      <span className="block w-full truncate bg-black/50 rounded-full px-2 py-0.5 shadow-lg">
        {player.name}
      </span>
      <Badge variant="secondary" className="mt-1 text-[10px] leading-tight">
        {player.position}
      </Badge>
    </div>
  </div>
);

// Positions for a vertical 4-3-3 formation
// [top, left] percentages for a vertical field
const formationPositions = {
    goalkeeper: [
        [92, 50], // GK
    ],
    defenders: [
        [75, 10], // LB
        [72, 35], // LCB
        [72, 65], // RCB
        [75, 90], // RB
    ],
    midfielders: [
        [50, 25], // LCM
        [48, 50], // CM
        [50, 75], // RCM
    ],
    forwards: [
        [15, 15], // LW
        [12, 50], // ST
        [15, 85], // RW
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
    <div className="relative w-full max-w-lg mx-auto aspect-[2/3] rounded-lg border-4 border-white/30 overflow-hidden shadow-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-4">
        {/* Field lines using SVG for crispness and vertical orientation */}
        <svg width="100%" height="100%" viewBox="0 0 200 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <rect width="200" height="300" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center line */}
            <line x1="0" y1="150" x2="200" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center circle */}
            <circle cx="100" cy="150" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Center spot */}
            <circle cx="100" cy="150" r="1" fill="rgba(255,255,255,0.2)" />
            {/* Home penalty area */}
            <rect x="30" y="255" width="140" height="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Home goal area */}
            <rect x="60" y="285" width="80" height="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Away penalty area */}
            <rect x="30" y="0" width="140" height="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
             {/* Away goal area */}
            <rect x="60" y="0" width="80" height="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
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
