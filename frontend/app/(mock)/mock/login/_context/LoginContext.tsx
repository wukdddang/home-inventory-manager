"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { setAuthUser } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LoginContextType = {
  error: string | null;
  /** 데모 로그인: 이메일만 검증 후 세션 저장 및 대시보드로 이동 */
  로그인을_제출_한다: (email: string) => void;
};

export type LoginProviderProps = { children: ReactNode };

export const LoginContext = createContext<LoginContextType | undefined>(
  undefined,
);

export function LoginProvider({ children }: LoginProviderProps) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const [error, setError] = useState<string | null>(null);

  const 로그인을_제출_한다 = useCallback(
    (email: string) => {
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
      로그인을_제출_한다,
    }),
    [error, 로그인을_제출_한다],
  );

  return (
    <LoginContext.Provider value={value}>{children}</LoginContext.Provider>
  );
}
