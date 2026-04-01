"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * SignupContextType·SignupContext·CurrentSignupProvider 는
 * `(current)/signup/_context/SignupContext` 에 있다.
 *
 * 이 파일은 localStorage 기반 mock 서비스를 주입하는
 * MockSignupProvider 만 담당한다.
 */

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { setAuthUser } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  SignupContext,
  type SignupContextType,
  type SignupPayload,
} from "@/app/(current)/signup/_context/SignupContext";

export type { SignupContextType, SignupPayload };
export { SignupContext } from "@/app/(current)/signup/_context/SignupContext";

/** mock 경로 전용 Provider. API 호출 없이 localStorage로 처리한다. */
export function MockSignupProvider({ children }: { children: ReactNode }) {
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
      loading: false,
      가입을_제출_한다,
    }),
    [error, 가입을_제출_한다],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}
