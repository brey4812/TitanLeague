"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";

const navItems = [
  { href: "/", icon: Icons.Dashboard, label: "Panel" },
  { href: "/leagues", icon: Icons.League, label: "Ligas" },
  { href: "/teams", icon: Icons.Teams, label: "Equipos" },
  { href: "/tournaments", icon: Icons.Tournaments, label: "Torneos" },
  { href: "/stats", icon: Icons.Stats, label: "Estadísticas" },
  { href: "/h2h", icon: Icons.H2H, label: "H2H" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Icons.Logo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline text-primary">Liga Titán</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                tooltip={{ children: "Configuración" }}
                className="justify-start"
              >
                <Link href="/settings">
                  <Icons.Settings />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
