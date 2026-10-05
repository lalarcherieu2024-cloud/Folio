"use client";

import { Eraser } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const W = 600, H = 180;
const INK = "#0b3350";
const SCRIPT = `"Snell Roundhand", "Apple Chancery", "Brush Script MT", "Segoe Script", cursive`;

/** Draw a signature with the mouse or a finger, or type your name and let it be set in a signature font. Reports a PNG data URL, or null when empty. */
export function SignaturePad({ onChange, disabled }: { onChange: (png: string | null) => void; disabled?: boolean }) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const clear = () => {
    const c = canvas.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange(null);
  };

  // Switching tabs starts from a clean slate so what you see is exactly what gets signed.
  const switchMode = (m: "draw" | "type") => { setMode(m); setTyped(""); clear(); };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d")!, { x, y } = point(e);
    ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y); ctx.stroke();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d")!, { x, y } = point(e);
    ctx.lineTo(x, y); ctx.stroke();
    dirty.current = true;
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(dirty.current ? e.currentTarget.toDataURL("image/png") : null);
  };

  function type(value: string) {
    const text = value.slice(0, 40);
    setTyped(text);
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    if (!text.trim()) return onChange(null);
    let size = 84;
    ctx.fillStyle = INK; ctx.textBaseline = "middle";
    do { ctx.font = `${size}px ${SCRIPT}`; size -= 4; } while (ctx.measureText(text).width > W - 40 && size > 24);
    ctx.fillText(text, 20, H / 2);
    onChange(c.toDataURL("image/png"));
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1 text-[0.8125rem]">
        {(["draw", "type"] as const).map((m) => (
          <button key={m} type="button" disabled={disabled} onClick={() => switchMode(m)} className={cn("rounded-md px-2.5 py-1 font-medium", mode === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>{m === "draw" ? "Draw" : "Type"}</button>
        ))}
        <button type="button" disabled={disabled} onClick={() => { setTyped(""); clear(); }} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"><Eraser className="size-3.5" />Clear</button>
      </div>
      {mode === "type" && <Input value={typed} onChange={(e) => type(e.target.value)} disabled={disabled} placeholder="Type your full name" aria-label="Type your name" className="h-9" />}
      <div className="relative rounded-lg border bg-white">
        <canvas ref={canvas} width={W} height={H} onPointerDown={mode === "draw" ? down : undefined} onPointerMove={mode === "draw" ? move : undefined} onPointerUp={up} onPointerCancel={up}
          aria-label="Signature area" className={cn("block h-[7.5rem] w-full rounded-lg", mode === "draw" ? "cursor-crosshair touch-none" : "pointer-events-none")} />
        <div className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-dashed border-zinc-300" />
        <span className="pointer-events-none absolute left-6 top-2 text-[0.6875rem] uppercase tracking-wide text-zinc-400">{mode === "draw" ? "Sign here" : "Preview"}</span>
      </div>
    </div>
  );
}
