import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import MainNav from "@/components/MainNav";
import { Toaster } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSession } from "@/lib/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "AbyssTracker",
  description: "Gestión v3.0",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${nunito.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* El Banner se renderiza con position: fixed y z-index alto */}
          <DemoBanner />

          {/* 
            Contenedor principal: 
            Si estamos en modo demo, aplicamos un padding superior (pt) 
            para compensar la altura del banner fijo y evitar que tape el layout.
          */}
          <div className={cn(
            "flex flex-col md:flex-row min-h-screen",
            isDemoMode && "pt-[33px] md:pt-[37px]"
          )}>
            <MainNav role={session?.role} userName={session?.name} />

            <main className="flex-1 relative overflow-y-auto h-screen custom-scrollbar bg-background pt-16 md:pt-0">
              {children}
            </main>
          </div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}