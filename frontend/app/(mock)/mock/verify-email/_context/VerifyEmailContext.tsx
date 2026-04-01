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
 * Mock 이메일 인증 Provider.
 * token이 존재하면 짧은 딜레이 후 성공, 없으면 에러를 표시한다.
 */
export function VerifyEmailProvider({
  token,
  children,
}: {
  token: string | null;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<VerifyEmailStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("유효하지 않은 인증 링크입니다.");
      return;
    }

    // mock: 짧은 딜레이 후 성공 시뮬레이션
    const timer = setTimeout(() => {
      if (token === "expired") {
        setStatus("error");
        setMessage("만료된 인증 링크입니다. 회원가입을 다시 진행해 주세요.");
      } else {
        setStatus("success");
        setMessage("이메일 인증이 완료되었습니다!");
      }
    }, 800);

    return () => clearTimeout(timer);
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
