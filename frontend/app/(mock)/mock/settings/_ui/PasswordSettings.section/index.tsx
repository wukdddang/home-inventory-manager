"use client";

import { FormEvent, useState } from "react";

export function PasswordSettingsSection() {
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
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
    setPwMsg("데모 환경: 실제로 서버에 반영되지 않았습니다.");
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">비밀번호 변경</h2>
      <p className="mt-1 text-sm text-zinc-500">
        데모 UI입니다. 제출 시 클라이언트에서만 검증합니다.
      </p>
      <form
        onSubmit={handlePasswordSubmit}
        className="mt-4 max-w-md space-y-3"
      >
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">현재 비밀번호</label>
          <input
            type="password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">새 비밀번호</label>
          <input
            type="password"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">새 비밀번호 확인</label>
          <input
            type="password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        {pwMsg ? (
          <p className="text-sm text-teal-300/90" role="status">
            {pwMsg}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          비밀번호 변경
        </button>
      </form>
    </section>
  );
}
