"use client";

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VerifyEmailStatus = "loading" | "success" | "error";

export type VerifyEmailContextType = {
  status: VerifyEmailStatus;
  message: string | null;
};

export const VerifyEmailContext = createContext<
  VerifyEmailContextType | undefined
>(undefined);

/**
 * 실제 API 연결 이메일 인증 Provider.
 * GET /api/auth/verify-email?token=... 을 호출하여 결과를 반영한다.
 */
export function VerifyEmailProvider({
  token,
  children,
}: {
  token: string | null;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<VerifyEmailStatus>(() =>
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState<string | null>(() =>
    token ? null : "유효하지 않은 인증 링크입니다.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function 이메일_인증을_요청한다() {
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token!)}`,
        );
        if (cancelled) return;

        const body = await res.json();

        if (res.ok && body.success) {
          setStatus("success");
          setMessage("이메일 인증이 완료되었습니다!");
        } else {
          setStatus("error");
          setMessage(
            body.message ?? "이메일 인증에 실패했습니다. 다시 시도해 주세요.",
          );
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        }
      }
    }

    이메일_인증을_요청한다();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<VerifyEmailContextType>(
    () => ({ status, message }),
    [status, message],
  );

  return (
    <VerifyEmailContext.Provider value={value}>
      {children}
    </VerifyEmailContext.Provider>
  );
}
