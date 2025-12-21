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

export function FootballField({ formation }: FootballFieldProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] bg-green-800 rounded-lg border-4 border-green-500/50 overflow-hidden">
      {/* Field Markings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-[45%] rounded-full border-2 border-green-500/50"></div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-green-500/50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500/50"></div>
      
      {/* Goal Areas */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-3/5 w-1/6 border-y-2 border-r-2 border-green-500/50 rounded-r-lg"></div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1/3 w-10 border-y-2 border-r-2 border-green-500/50 rounded-r-md"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-3/5 w-1/6 border-y-2 border-l-2 border-green-500/50 rounded-l-lg"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-1/3 w-10 border-y-2 border-l-2 border-green-500/50 rounded-l-md"></div>
      
      {/* Formation */}
      <div className="absolute inset-0 flex flex-col justify-around py-4">
        {/* Forwards (3) */}
        <div className="flex justify-around items-center">
            {formation.forwards.map((p) => <PlayerCard key={p.id} player={p}/>)}
        </div>

        {/* Midfielders (3) */}
        <div className="flex justify-around items-center">
             {formation.midfielders.map((p) => <PlayerCard key={p.id} player={p}/>)}
        </div>

        {/* Defenders (4) */}
        <div className="flex justify-around items-center">
             {formation.defenders.map((p) => <PlayerCard key={p.id} player={p}/>)}
        </div>

        {/* Goalkeeper (1) */}
        <div className="flex justify-center items-center">
             {formation.goalkeeper.map((p) => <PlayerCard key={p.id} player={p}/>)}
        </div>
      </div>
    </div>
  );
}
