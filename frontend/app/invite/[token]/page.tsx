"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InvitationInfo = {
  id: string;
  householdName: string;
  role: string;
  invitedByDisplayName?: string;
  inviteeEmail?: string | null;
  expiresAt?: string;
  status?: string;
};

type PageState =
  | { phase: "loading" }
  | { phase: "ready"; invitation: InvitationInfo }
  | { phase: "accepting" }
  | { phase: "success"; householdName: string }
  | { phase: "error"; message: string };

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  editor: "편집자",
  viewer: "조회자",
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [state, setState] = useState<PageState>({ phase: "loading" });

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

  const handleAccept = async () => {
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
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5 text-teal-400"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">거점 초대</h1>
            <p className="text-xs text-zinc-400">집비치기 Home Inventory</p>
          </div>
        </div>

        {state.phase === "loading" && (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-800" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-zinc-800" />
            <div className="mt-6 h-10 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        )}

        {state.phase === "ready" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/40 p-4">
              <p className="text-xs font-medium text-zinc-400">초대 거점</p>
              <p className="mt-1 text-base font-semibold text-zinc-100">
                {state.invitation.householdName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/40 p-3">
                <p className="text-xs font-medium text-zinc-400">부여 역할</p>
                <p className="mt-1 text-sm font-medium text-teal-300">
                  {ROLE_LABELS[state.invitation.role] ?? state.invitation.role}
                </p>
              </div>
              {state.invitation.expiresAt && (
                <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/40 p-3">
                  <p className="text-xs font-medium text-zinc-400">만료일</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">
                    {new Date(state.invitation.expiresAt).toLocaleDateString(
                      "ko-KR",
                    )}
                  </p>
                </div>
              )}
            </div>

            {state.invitation.invitedByDisplayName && (
              <p className="text-xs text-zinc-400">
                초대자:{" "}
                <span className="text-zinc-300">
                  {state.invitation.invitedByDisplayName}
                </span>
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleAccept()}
              className="w-full cursor-pointer rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-teal-400 active:bg-teal-600"
            >
              거점 참여하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full cursor-pointer rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              거절
            </button>
          </div>
        )}

        {state.phase === "accepting" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-teal-400" />
            <p className="text-sm text-zinc-300">거점에 참여하는 중…</p>
          </div>
        )}

        {state.phase === "success" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-teal-500/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-7 text-teal-400"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                참여 완료!
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                <span className="font-medium text-teal-300">
                  {state.householdName}
                </span>{" "}
                거점에 참여했습니다.
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                잠시 후 대시보드로 이동합니다…
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-2 cursor-pointer rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
            >
              대시보드로 이동
            </button>
          </div>
        )}

        {state.phase === "error" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-rose-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-7 text-rose-400"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">오류 발생</p>
              <p className="mt-1 text-sm text-zinc-300">{state.message}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 cursor-pointer rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              로그인 페이지로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
