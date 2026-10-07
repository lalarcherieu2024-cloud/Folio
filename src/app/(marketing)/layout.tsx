import { Frame } from "@/components/shell/Frame";

// The app or public frame is picked here, per section, rather than in the root layout (see Frame).
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Frame>{children}</Frame>;
}
