export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.56 }}
      className="grid place-items-center rounded-[5px] border-2 border-[#2340a8] bg-white font-serif font-bold leading-none text-[#2340a8] shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_5px_#b8322a]"
    >
      F
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-serif text-[1.45rem] font-semibold tracking-tight">Folio</span>
    </span>
  );
}
