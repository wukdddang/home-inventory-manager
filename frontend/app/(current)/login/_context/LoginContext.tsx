"use client";

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
  loading: boolean;
  로그인을_제출_한다: (email: string, password: string) => void;
};

export const LoginContext = createContext<LoginContextType | undefined>(
  undefined,
);

export function LoginProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const 로그인을_제출_한다 = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("이메일을 입력하세요.");
        return;
      }
      if (!password) {
        setError("비밀번호를 입력하세요.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message ?? "로그인에 실패했습니다.");
          return;
        }

        // 내 정보 조회 → localStorage에 저장 (AuthGuard 용)
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success && meData.data) {
          setAuthUser({
            email: meData.data.email,
            displayName: meData.data.displayName,
            emailVerified: !!meData.data.emailVerifiedAt,
          });
        }

        router.replace("/dashboard");
      } catch (err) {
        console.error("로그인 처리 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "로그인 처리 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const value = useMemo<LoginContextType>(
    () => ({ error, loading, 로그인을_제출_한다 }),
    [error, loading, 로그인을_제출_한다],
  );

  return (
    <LoginContext.Provider value={value}>{children}</LoginContext.Provider>
  );
}
