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

export type SignupPayload = {
  displayName: string;
  email: string;
  password: string;
  confirm: string;
};

export type SignupContextType = {
  error: string | null;
  loading: boolean;
  가입을_제출_한다: (payload: SignupPayload) => void;
};

export const SignupContext = createContext<SignupContextType | undefined>(
  undefined,
);

export function SignupProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const 가입을_제출_한다 = useCallback(
    async (payload: SignupPayload) => {
      setError(null);
      if (!payload.displayName.trim()) {
        setError("이름을 입력하세요.");
        return;
      }
      if (!payload.email.trim()) {
        setError("이메일을 입력하세요.");
        return;
      }
      if (payload.password.length < 8) {
        setError("비밀번호는 8자 이상으로 해주세요.");
        return;
      }
      if (payload.password !== payload.confirm) {
        setError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email.trim(),
            password: payload.password,
            displayName: payload.displayName.trim(),
          }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message ?? "회원가입에 실패했습니다.");
          return;
        }

        // 내 정보 조회 → localStorage에 저장
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
        console.error("회원가입 처리 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "가입 처리 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const value = useMemo<SignupContextType>(
    () => ({ error, loading, 가입을_제출_한다 }),
    [error, loading, 가입을_제출_한다],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}
