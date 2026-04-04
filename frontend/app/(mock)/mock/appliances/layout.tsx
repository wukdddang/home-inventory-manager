import { AppShell } from "@/app/(mock)/mock/_ui/AppShell.component";

/** `/mock/appliances` — 미리보기용 (AuthGuard 없음) */
export default function MockAppliancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
