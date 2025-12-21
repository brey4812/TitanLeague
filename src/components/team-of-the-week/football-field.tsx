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
  <div className="flex flex-col items-center text-center w-24 md:w-28 z-10">
    <div className="relative w-12 h-12 md:w-16 md:h-16 mb-1">
      <Image
        src={player.teamLogoUrl}
        alt={player.teamName}
        width={64}
        height={64}
        className="rounded-full border-2 border-white bg-gray-200 object-cover"
        data-ai-hint={player.teamDataAiHint}
      />
    </div>
    <p className="text-xs font-bold text-white truncate w-full bg-black/50 rounded-full px-2 py-0.5">{player.name}</p>
    <Badge variant="secondary" className="mt-1 text-xs">{player.position}</Badge>
  </div>
);

// Positions for a 4-3-3 formation
// [top, left] percentages
const formationPositions = {
    goalkeeper: [
        [85, 50],
    ],
    defenders: [
        [65, 20], [60, 40], [60, 60], [65, 80],
    ],
    midfielders: [
        [40, 25], [35, 50], [40, 75],
    ],
    forwards: [
        [15, 20], [10, 50], [15, 80],
    ]
};


export function FootballField({ formation }: FootballFieldProps) {
  
  const renderPlayer = (player: TeamOfTheWeekPlayer, positions: number[][], index: number) => {
    if (!player || !positions[index]) return null;
    const [top, left] = positions[index];
    return (
        <div 
            key={player.id} 
            className="absolute" 
            style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
        >
            <PlayerCard player={player} />
        </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/10] bg-green-800 rounded-lg border-4 border-green-500/50 overflow-hidden">
      {/* Field Markings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-[40%] rounded-full border-2 border-green-500/50"></div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-green-500/50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500/50"></div>
      
      {/* Goal Areas */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-3/5 w-1/6 border-y-2 border-r-2 border-green-500/50 rounded-r-lg"></div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1/3 w-10 border-y-2 border-r-2 border-green-500/50 rounded-r-md"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-3/5 w-1/6 border-y-2 border-l-2 border-green-500/50 rounded-l-lg"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-1/3 w-10 border-y-2 border-l-2 border-green-500/50 rounded-l-md"></div>
      
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