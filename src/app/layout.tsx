import type { Metadata } from "next";
import { Fraunces, Manrope, Nunito } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import { getSession } from "@/lib/auth";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["700", "800", "900"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Folio: real projects, verified proof",
  description: "Do paid projects for startups and fellow students. Every finished project becomes verified proof of your skills.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${nunito.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <NavBar user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-9 md:px-8">{children}</main>
        <footer className="border-t border-line py-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 text-center md:px-8">
            <Logo size={64} text="text-4xl" />
            <p className="text-sm text-muted">Real projects. Real pay. Real proof. · Madrid · Built by IE students</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
