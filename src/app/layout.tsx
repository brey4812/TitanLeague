import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: 'Titan League Simulator',
  description: 'A complete football league simulation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background text-foreground")}>
        <SidebarProvider>
            <SidebarNav />
            <div className="md:ml-[var(--sidebar-width-icon)] lg:ml-[var(--sidebar-width)] group-data-[collapsible=icon]:md:ml-[var(--sidebar-width-icon)] transition-[margin-left] duration-300 ease-in-out">
                <SiteHeader />
                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
