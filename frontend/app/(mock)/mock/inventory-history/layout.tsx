import { AppShell } from "@/app/(mock)/mock/_ui/AppShell.component";

export default function MockInventoryHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
