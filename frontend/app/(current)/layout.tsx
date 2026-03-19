/**
 * 로그인·가입은 가드 없음. `dashboard`·`settings`는 각 세그먼트 `layout.tsx`에서 AuthGuard.
 */
export default function CurrentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
