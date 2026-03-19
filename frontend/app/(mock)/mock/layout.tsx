/** `/mock` 하위는 (shell) 레이아웃이 있는 페이지만 Auth + AppShell 적용 */
export default function MockSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
