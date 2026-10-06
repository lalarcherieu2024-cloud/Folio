"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IE_PROGRAMS, parseProgram } from "@/lib/ie-programs";
import { cn } from "@/lib/utils";

const select = "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** IE degree + expected graduation year, posted as one `program` field ("Bachelor in …, 2027") like before. */
export function ProgramPicker({ defaultValue = "", name = "program", hint }: { defaultValue?: string; name?: string; hint?: string }) {
  const start = parseProgram(defaultValue);
  const [program, setProgram] = useState(start.program);
  const [other, setOther] = useState(start.other);
  const [year, setYear] = useState(start.year);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => String(thisYear + i));
  if (year && !years.includes(year)) years.unshift(year); // keep an older saved year selectable
  const chosen = program === "other" ? other.trim() : program;
  const value = chosen ? (year ? `${chosen}, ${year}` : chosen) : "";

  return (
    <div className="grid gap-1.5">
      <input type="hidden" name={name} value={value} />
      <div className="grid gap-3 sm:grid-cols-[1fr_8.5rem]">
        <div className="grid gap-1.5">
          <Label htmlFor="program-select">Degree at IE University</Label>
          <select id="program-select" value={program} onChange={(e) => setProgram(e.target.value)} className={cn(select, !program && "text-muted-foreground")}>
            <option value="">Choose your degree…</option>
            {IE_PROGRAMS.map((g) => (
              <optgroup key={g.group} label={g.group}>{g.programs.map((p) => <option key={p} value={p}>{p}</option>)}</optgroup>
            ))}
            <option value="other">Other / not listed</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="program-year">Graduating</Label>
          <select id="program-year" value={year} onChange={(e) => setYear(e.target.value)} className={cn(select, !year && "text-muted-foreground")}>
            <option value="">Year…</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {program === "other" && <Input aria-label="Your programme" value={other} onChange={(e) => setOther(e.target.value)} maxLength={120} placeholder="e.g. Exchange semester, Executive programme" className="h-9 bg-white" />}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
