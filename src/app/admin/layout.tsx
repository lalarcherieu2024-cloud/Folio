import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

// The admin pages: a plain frame of their own (not the student or company app), so it's always clear where you are.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[72rem] items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2" aria-label="Folio home"><Logo size={36} animated={false} /><span className="text-lg font-semibold tracking-tight">Folio</span></Link>
          <span className="h-5 w-px bg-border" aria-hidden />
          <span className="text-sm font-medium text-zinc-600">Admin</span>
          <span className="flex-1" />
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">Back to Folio</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[72rem] flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
