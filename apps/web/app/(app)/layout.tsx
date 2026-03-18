import { ProtectedShell } from "../../src/components/protected-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}

