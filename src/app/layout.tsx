import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { getSession } from "@/lib/auth";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600", "700"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Folio: real projects, verified proof",
  description: "Do paid projects for startups and fellow students. Every finished project becomes verified proof of your skills.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <NavBar user={user} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-9">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">Folio · Madrid · Built by IE students</footer>
      </body>
    </html>
  );
}
