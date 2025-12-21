import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm md:hidden">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h1 className="font-bold font-headline text-lg">Titan League</h1>
        </div>
      </div>
    </header>
  );
}
