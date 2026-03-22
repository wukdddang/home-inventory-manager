import { AppShell } from "@/app/(current)/_ui/AppShell.component";

export default function MockInventoryHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
