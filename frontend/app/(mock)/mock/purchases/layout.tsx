import { AppShell } from "@/app/(mock)/mock/_ui/AppShell.component";

/** `/mock/purchases` — 미리보기용 (AuthGuard 없음) */
export default function MockPurchasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
