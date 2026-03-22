"use client";

import { FormModal } from "@/app/_ui/form-modal";
import { toast } from "@/hooks/use-toast";
import {
  getAuthUserSnapshot,
  getMockSettingsAccountUserSnapshot,
  MOCK_SETTINGS_ACCOUNT_SEED,
  setAuthUser,
  setMockSettingsAccountUser,
  subscribeAuthUser,
  subscribeMockSettingsAccountUser,
} from "@/lib/local-store";
import type { AuthUser } from "@/types/domain";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

function AccountSecuritySettingsBody({
  user,
  isMockRoute,
  persistUser,
}: {
  user: AuthUser | null;
  isMockRoute: boolean;
  persistUser: (next: AuthUser) => void;
}) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const resetPasswordFields = () => {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwMsg("");
  };

  const openProfileModal = () => {
    setDisplayName(user?.displayName ?? "");
    setProfileModalOpen(true);
  };

  const resetProfileModalFields = () => {
    setDisplayName(user?.displayName ?? "");
  };

  const handleProfileModalSubmit = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "계정 정보를 저장하려면 먼저 로그인하세요.",
        variant: "warning",
      });
      return;
    }
    const name = displayName.trim();
    if (!name) {
      toast({ title: "이름을 입력하세요", variant: "warning" });
      return;
    }
    persistUser({ ...user, displayName: name });
    toast({
      title: "프로필을 저장했습니다",
      description: isMockRoute
        ? "목 계정 · him-mock-settings-account"
        : "him-user (로컬)",
    });
    setProfileModalOpen(false);
  };

  const handleSendVerification = () => {
    toast({
      title: "인증 메일을 보냈습니다",
      description: "데모: 실제로 메일은 발송되지 않습니다.",
    });
  };

  const handleMarkVerifiedMock = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        variant: "warning",
      });
      return;
    }
    persistUser({ ...user, emailVerified: true });
    toast({
      title: "이메일 인증 완료(모의)",
      description: "API 연동 시 서버에서 검증합니다.",
    });
  };

  const handlePasswordModalSubmit = () => {
    setPwMsg("");
    if (pwNew.length < 4) {
      setPwMsg("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!pwCurrent) {
      setPwMsg("현재 비밀번호를 입력하세요. (데모: 아무 값)");
      return;
    }
    toast({
      title: "비밀번호 변경 요청(데모)",
      description: "백엔드 연동 후 PATCH /me/password 등으로 전송합니다.",
    });
    setPasswordModalOpen(false);
  };

  const verified = user?.emailVerified === true;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">계정 · 보안</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {isMockRoute ? (
          <>
            <span className="text-teal-400/90">/mock</span> 전용{" "}
            <strong className="font-medium text-zinc-300">목 계정</strong>
            입니다. API·로그인(<code className="text-zinc-400">him-user</code>
            )과 분리되어 <code className="text-zinc-400">him-mock-settings-account</code>에
            저장됩니다.
          </>
        ) : (
          <>
            프로필·이메일 인증·비밀번호 UI입니다. 로그인 세션은{" "}
            <code className="text-zinc-400">him-user</code>와 동기화됩니다.
          </>
        )}
      </p>

      <div className="mt-6 border-t border-zinc-800/80 pt-6">
        <h3 className="text-sm font-medium text-zinc-200">계정 · 프로필</h3>
        <p className="mt-1 text-xs text-zinc-500">
          이메일·표시 이름·인증은 모달에서 관리합니다.
        </p>
        {!user ? (
          <p className="mt-2 text-sm text-zinc-500">
            로그인한 사용자만 편집할 수 있습니다.{" "}
            <span className="text-zinc-600">
              `/settings`에서는 로그인 후 이용하세요.
            </span>
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="truncate font-medium text-zinc-200">
                {user.email}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="truncate text-zinc-400">{user.displayName}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  verified
                    ? "bg-teal-500/20 text-teal-200"
                    : "bg-amber-500/15 text-amber-200/90"
                }`}
              >
                {verified ? "인증됨" : "미인증"}
              </span>
            </div>
            <button
              type="button"
              onClick={openProfileModal}
              className="shrink-0 cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              계정·프로필 관리…
            </button>
          </div>
        )}
      </div>

      <FormModal
        open={profileModalOpen}
        onOpenChange={(open) => {
          setProfileModalOpen(open);
          if (!open) resetProfileModalFields();
        }}
        title="계정 · 프로필 관리"
        description="표시 이름을 저장하고, 이메일 인증 관련 동작을 연습할 수 있습니다."
        submitLabel="프로필 저장"
        cancelLabel="닫기"
        onSubmit={handleProfileModalSubmit}
        submitDisabled={!user || !displayName.trim()}
      >
        {user ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">이메일 (로그인 ID)</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className={`${inputClass} cursor-not-allowed opacity-80`}
                aria-readonly="true"
              />
              <p className="text-[11px] text-zinc-600">
                변경은 보안 정책에 따라 별도 플로우로 두는 것을 권장합니다.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">표시 이름</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="홍길동"
              />
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-400">이메일 인증</p>
              <p className="mt-1 text-[11px] text-zinc-500">
                가입 후 인증 링크 등 백엔드 플로우와 맞출 수 있습니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    verified
                      ? "bg-teal-500/20 text-teal-200"
                      : "bg-amber-500/15 text-amber-200/90"
                  }`}
                >
                  {verified ? "인증됨" : "미인증"}
                </span>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  인증 메일 보내기 (데모)
                </button>
                {!verified ? (
                  <button
                    type="button"
                    onClick={handleMarkVerifiedMock}
                    className="cursor-pointer rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-200 hover:bg-teal-500/20"
                  >
                    모의로 인증 완료
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>

      <div className="mt-6 border-t border-zinc-800/80 pt-6">
        <h3 className="text-sm font-medium text-zinc-200">비밀번호</h3>
        <p className="mt-1 text-xs text-zinc-500">
          변경은 모달에서 진행합니다. 데모에서는 클라이언트만 검증합니다.
        </p>
        <button
          type="button"
          disabled={!user}
          onClick={() => {
            resetPasswordFields();
            setPasswordModalOpen(true);
          }}
          className="mt-3 cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          비밀번호 변경…
        </button>
      </div>

      <FormModal
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open);
          if (!open) resetPasswordFields();
        }}
        title="비밀번호 변경"
        description="현재 비밀번호와 새 비밀번호를 입력하세요. 데모에서는 서버로 전송되지 않습니다."
        submitLabel="변경"
        cancelLabel="취소"
        onSubmit={handlePasswordModalSubmit}
        submitDisabled={!pwCurrent || !pwNew || !pwConfirm}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">현재 비밀번호</label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">새 비밀번호</label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">새 비밀번호 확인</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          {pwMsg ? (
            <p className="text-sm text-amber-300/95" role="status">
              {pwMsg}
            </p>
          ) : null}
        </div>
      </FormModal>
    </section>
  );
}

export function AccountSecuritySettingsSection() {
  const pathname = usePathname();
  const isMockRoute = pathname.startsWith("/mock");

  const sessionUser = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );
  const mockAccountUser = useSyncExternalStore(
    subscribeMockSettingsAccountUser,
    getMockSettingsAccountUserSnapshot,
    () => MOCK_SETTINGS_ACCOUNT_SEED,
  );

  const user = isMockRoute ? mockAccountUser : sessionUser;
  const persistUser = isMockRoute
    ? setMockSettingsAccountUser
    : setAuthUser;

  return (
    <AccountSecuritySettingsBody
      key={`${isMockRoute ? "mock" : "session"}-${user?.email ?? "none"}`}
      user={user}
      isMockRoute={isMockRoute}
      persistUser={persistUser}
    />
  );
}
