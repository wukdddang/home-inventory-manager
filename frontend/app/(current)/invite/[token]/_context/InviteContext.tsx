"use client";

/**
 * Invite 베이스 Context + API 서비스 주입 래퍼.
 *
 * 구조:
 *   InvitationInfo          — 초대 정보 타입
 *   InvitePageState         — 페이지 상태 Union
 *   InviteContextType       — 공통 컨텍스트 타입
 *   InviteContext            — React Context
 *   CurrentInviteProvider    — API 호출 기반 래퍼 (current 경로 전용)
 *
 * mock 전용 래퍼(MockInviteProvider)는
 * `(mock)/mock/invite/[token]/_context/InviteContext` 에 있다.
 */

import { useParams, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ─────────────────────── Types ─────────────────────── */

export type InvitationInfo = {
  id: string;
  householdName: string;
  role: string;
  invitedByDisplayName?: string;
  inviteeEmail?: string | null;
  expiresAt?: string;
  status?: string;
};

export type InvitePageState =
  | { phase: "loading" }
  | { phase: "ready"; invitation: InvitationInfo }
  | { phase: "accepting" }
  | { phase: "success"; householdName: string }
  | { phase: "error"; message: string };

/* ─────────────────────── Context Type ─────────────────────── */

export type InviteContextType = {
  state: InvitePageState;
  초대를_수락_한다: () => void;
  대시보드로_이동_한다: () => void;
  로그인으로_이동_한다: () => void;
};

export const InviteContext = createContext<InviteContextType | undefined>(
  undefined,
);

/* ─────────────────────── Current Provider ─────────────────────── */

/** current 경로 전용 Provider. 백엔드 API를 호출한다. */
export function CurrentInviteProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [state, setState] = useState<InvitePageState>({ phase: "loading" });

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const json = (await res.json()) as {
          success: boolean;
          data?: InvitationInfo;
          message?: string;
        };
        if (!json.success || !json.data) {
          setState({
            phase: "error",
            message: json.message ?? "초대 링크를 찾을 수 없습니다.",
          });
          return;
        }
        setState({ phase: "ready", invitation: json.data });
      } catch {
        setState({
          phase: "error",
          message: "초대 정보를 불러오는 중 오류가 발생했습니다.",
        });
      }
    })();
  }, [token]);

  const 초대를_수락_한다 = useCallback(async () => {
    if (state.phase !== "ready") return;
    const householdName = state.invitation.householdName;
    setState({ phase: "accepting" });
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
      };
      if (!json.success) {
        setState({
          phase: "error",
          message: json.message ?? "초대 수락에 실패했습니다.",
        });
        return;
      }
      setState({ phase: "success", householdName });
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch {
      setState({
        phase: "error",
        message: "초대 수락 중 오류가 발생했습니다.",
      });
    }
  }, [state, token, router]);

  const 대시보드로_이동_한다 = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const 로그인으로_이동_한다 = useCallback(() => {
    router.push("/login");
  }, [router]);

  const value = useMemo<InviteContextType>(
    () => ({ state, 초대를_수락_한다, 대시보드로_이동_한다, 로그인으로_이동_한다 }),
    [state, 초대를_수락_한다, 대시보드로_이동_한다, 로그인으로_이동_한다],
  );

  return (
    <InviteContext.Provider value={value}>{children}</InviteContext.Provider>
  );
}
