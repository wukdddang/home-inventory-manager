"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * InviteContextType·InviteContext·CurrentInviteProvider 는
 * `(current)/invite/[token]/_context/InviteContext` 에 있다.
 *
 * 이 파일은 localStorage 기반 mock 서비스를 주입하는
 * MockInviteProvider 만 담당한다.
 */

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  InviteContext,
  type InviteContextType,
  type InvitePageState,
  type InvitationInfo,
} from "@/app/(current)/invite/[token]/_context/InviteContext";

export type { InviteContextType, InvitePageState, InvitationInfo };
export { InviteContext } from "@/app/(current)/invite/[token]/_context/InviteContext";

/* ─────────────────────── Mock Data ─────────────────────── */

const MOCK_INVITATION: InvitationInfo = {
  id: "mock-inv-001",
  householdName: "우리집",
  role: "editor",
  invitedByDisplayName: "홍길동",
  inviteeEmail: "guest@example.com",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: "pending",
};

const MOCK_LATENCY_MS = 400;

/** mock 경로 전용 Provider. API 호출 없이 mock 데이터로 처리한다. */
export function MockInviteProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const token = params.token;

  const [state, setState] = useState<InvitePageState>({ phase: "loading" });

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      if (token === "expired") {
        setState({
          phase: "error",
          message: "만료된 초대 링크입니다.",
        });
      } else if (token === "invalid") {
        setState({
          phase: "error",
          message: "유효하지 않은 초대 링크입니다.",
        });
      } else {
        setState({
          phase: "ready",
          invitation: { ...MOCK_INVITATION, id: token },
        });
      }
    }, MOCK_LATENCY_MS);
    return () => clearTimeout(timer);
  }, [token]);

  const 초대를_수락_한다 = useCallback(() => {
    if (state.phase !== "ready") return;
    const householdName = state.invitation.householdName;
    setState({ phase: "accepting" });
    setTimeout(() => {
      setState({ phase: "success", householdName });
      setTimeout(() => {
        router.push(`${prefix}/dashboard`);
      }, 2500);
    }, MOCK_LATENCY_MS);
  }, [state, router, prefix]);

  const 대시보드로_이동_한다 = useCallback(() => {
    router.push(`${prefix}/dashboard`);
  }, [router, prefix]);

  const 로그인으로_이동_한다 = useCallback(() => {
    router.push(`${prefix}/login`);
  }, [router, prefix]);

  const value = useMemo<InviteContextType>(
    () => ({
      state,
      초대를_수락_한다,
      대시보드로_이동_한다,
      로그인으로_이동_한다,
    }),
    [state, 초대를_수락_한다, 대시보드로_이동_한다, 로그인으로_이동_한다],
  );

  return (
    <InviteContext.Provider value={value}>{children}</InviteContext.Provider>
  );
}
