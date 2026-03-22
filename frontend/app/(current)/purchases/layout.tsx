import { AppShell } from "../_ui/AppShell.component";
import { AuthGuard } from "../_ui/AuthGuard.component";

export default function CurrentPurchasesLayout({
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
