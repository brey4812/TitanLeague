import Image from 'next/image';
import { TeamOfTheWeekPlayer } from '@/lib/types';

interface FootballFieldProps {
  formation: {
    goalkeeper: TeamOfTheWeekPlayer[];
    defenders: TeamOfTheWeekPlayer[];
    midfielders: TeamOfTheWeekPlayer[];
    forwards: TeamOfTheWeekPlayer[];
  };
}

const PlayerCard = ({ player }: { player: TeamOfTheWeekPlayer }) => (
    <div className="relative flex flex-col items-center w-20 sm:w-24 transition-transform hover:scale-110">
      <div className="relative h-14 w-14 sm:h-16 sm:w-16">
        <Image
          src={player.teamLogoUrl || '/placeholder.png'}
          alt={player.name}
          layout="fill"
          className="rounded-full border-2 border-white bg-slate-800 object-contain p-1 drop-shadow-lg"
        />
        {/* Badge de Rating corregido */}
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-black w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md z-30">
          {player.rating || 0}
        </div>
      </div>
      <div className="relative -mt-3 z-20">
        <p className="whitespace-nowrap rounded-md bg-white px-2 py-0.5 text-center text-[10px] sm:text-xs font-bold text-black shadow-lg">
          {player.name.split(' ').pop()}
        </p>
      </div>
    </div>
);

const formationPositions = {
    goalkeeper: [[92, 50]],
    defenders: [[75, 10], [72, 35], [72, 65], [75, 90]],
    midfielders: [[50, 25], [48, 50], [50, 75]],
    forwards: [[20, 15], [18, 50], [20, 85]]
};

export function FootballField({ formation }: FootballFieldProps) {
  const renderPlayer = (player: TeamOfTheWeekPlayer, positions: number[][], index: number) => {
    if (!player || !positions[index]) return null;
    const [top, left] = positions[index];
    return (
        <div key={player.id} className="absolute" style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <PlayerCard player={player} />
        </div>
    );
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-lg border-4 border-white/30 overflow-hidden shadow-2xl bg-gradient-to-b from-green-600 to-emerald-800 p-2">
        <svg width="100%" height="100%" viewBox="0 0 200 300" preserveAspectRatio="none" className="absolute inset-0 opacity-40">
            <rect width="200" height="300" fill="none" stroke="white" strokeWidth="1" />
            <line x1="0" y1="150" x2="200" y2="150" stroke="white" strokeWidth="1" />
            <circle cx="100" cy="150" r="25" fill="none" stroke="white" strokeWidth="1" />
            <rect x="30" y="250" width="140" height="50" fill="none" stroke="white" strokeWidth="1" />
            <rect x="30" y="0" width="140" height="50" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      
        <div className="absolute inset-0">
            {formation.goalkeeper.map((p, i) => renderPlayer(p, formationPositions.goalkeeper, i))}
            {formation.defenders.map((p, i) => renderPlayer(p, formationPositions.defenders, i))}
            {formation.midfielders.map((p, i) => renderPlayer(p, formationPositions.midfielders, i))}
            {formation.forwards.map((p, i) => renderPlayer(p, formationPositions.forwards, i))}
        </div>
    </div>
  );
}