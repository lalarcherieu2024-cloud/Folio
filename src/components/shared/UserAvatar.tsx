import { initials, softColor } from "@/lib/work";
import { cn } from "@/lib/utils";

// A person's picture: their photo if they uploaded one, otherwise their initials on their chosen colour.
export function UserAvatar({ name, color, url, className }: { name: string; color?: string | null; url?: string | null; className?: string }) {
  return (
    <span style={url ? undefined : softColor(name, color)} className={cn("relative grid shrink-0 place-items-center overflow-hidden font-semibold", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="size-full object-cover" />
      ) : initials(name)}
    </span>
  );
}
