import { AppShell } from "@/app/(current)/_ui/AppShell.component";

/** `/mock/dashboard` — 로그인 없이 미리보기 (AuthGuard 없음) */
export default function MockDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
