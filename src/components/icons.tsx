import type { SVGProps } from "react";
import {
  LayoutDashboard,
  Shield,
  Users,
  Trophy,
  BarChart3,
  Swords,
  Settings,
  Sun,
  Moon,
  Info,
  Download,
  Newspaper
} from "lucide-react";

export const Icons = {
  Dashboard: LayoutDashboard,
  League: Shield,
  Teams: Users,
  Tournaments: Trophy,
  Stats: BarChart3,
  H2H: Swords,
  Settings: Settings,
  Sun: Sun,
  Moon: Moon,
  Info: Info,
  Download: Download,
  Press: Newspaper,
  Logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
};
