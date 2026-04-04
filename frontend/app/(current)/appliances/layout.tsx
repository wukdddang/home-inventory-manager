import { AppShell } from "@/app/(mock)/mock/_ui/AppShell.component";
import { AuthGuard } from "@/app/(mock)/mock/_ui/AuthGuard.component";

export default function CurrentAppliancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
