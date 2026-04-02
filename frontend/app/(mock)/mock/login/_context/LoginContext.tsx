"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * LoginContextType·LoginContext·CurrentLoginProvider 는
 * `(current)/login/_context/LoginContext` 에 있다.
 *
 * 이 파일은 localStorage 기반 mock 서비스를 주입하는
 * MockLoginProvider 만 담당한다.
 */

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { setAuthUser } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  LoginContext,
  type LoginContextType,
} from "@/app/(current)/login/_context/LoginContext";

export type { LoginContextType };
export { LoginContext } from "@/app/(current)/login/_context/LoginContext";

/** mock 경로 전용 Provider. API 호출 없이 localStorage로 처리한다. */
export function MockLoginProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const [error, setError] = useState<string | null>(null);

  const 로그인을_제출_한다 = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (email: string, _password: string) => {
      setError(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setError("이메일을 입력하세요.");
        return;
      }
      try {
        setAuthUser({
          email: trimmed,
          displayName: trimmed.split("@")[0] || "사용자",
        });
        router.replace(`${prefix}/dashboard`);
      } catch (err) {
        console.error("로그인 처리 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "로그인 처리 중 오류가 발생했습니다.",
        );
      }
    },
    [router, prefix],
  );

  const value = useMemo<LoginContextType>(
    () => ({
      error,
      loading: false,
      로그인을_제출_한다,
    }),
    [error, 로그인을_제출_한다],
  );

  return (
    <LoginContext.Provider value={value}>{children}</LoginContext.Provider>
  );
}
