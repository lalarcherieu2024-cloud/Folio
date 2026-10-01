// Signed-out pages get their own container (the signed-in shell already provides one).
export function PublicWrap({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  return signedIn ? <>{children}</> : <div className="mx-auto w-full max-w-[1200px] px-6 py-10">{children}</div>;
}
