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

export type SignupPayload = {
  displayName: string;
  email: string;
  password: string;
  confirm: string;
};

export type SignupContextType = {
  error: string | null;
  /** 유효성 검사 후 로컬 세션 저장 및 대시보드로 이동 */
  가입을_제출_한다: (payload: SignupPayload) => void;
};

export type SignupProviderProps = { children: ReactNode };

export const SignupContext = createContext<SignupContextType | undefined>(
  undefined,
);

export function SignupProvider({ children }: SignupProviderProps) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const [error, setError] = useState<string | null>(null);

  const 가입을_제출_한다 = useCallback(
    (payload: SignupPayload) => {
      setError(null);
      if (!payload.displayName.trim()) {
        setError("이름을 입력하세요.");
        return;
      }
      if (!payload.email.trim()) {
        setError("이메일을 입력하세요.");
        return;
      }
      if (payload.password.length < 4) {
        setError("비밀번호는 4자 이상으로 해주세요.");
        return;
      }
      if (payload.password !== payload.confirm) {
        setError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
      try {
        setAuthUser({
          email: payload.email.trim(),
          displayName: payload.displayName.trim(),
        });
        router.replace(`${prefix}/dashboard`);
      } catch (err) {
        console.error("회원가입 처리 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "가입 처리 중 오류가 발생했습니다.",
        );
      }
    },
    [router, prefix],
  );

  const value = useMemo<SignupContextType>(
    () => ({
      error,
      가입을_제출_한다,
    }),
    [error, 가입을_제출_한다],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}
