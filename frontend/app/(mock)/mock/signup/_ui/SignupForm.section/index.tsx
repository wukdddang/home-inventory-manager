"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSignup } from "../../_hooks/useSignup";

export function SignupFormSection() {
  const prefix = useAppRoutePrefix();
  const { error, 가입을_제출_한다 } = useSignup();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    가입을_제출_한다({
      displayName,
      email,
      password,
      confirm,
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl shadow-black/40">
        <h1 className="text-2xl font-semibold text-white">회원가입</h1>
        <p className="mt-1 text-sm text-zinc-500">
          로컬 데모 계정이 생성됩니다. 실제 서버 검증은 추후 API로 연결하세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-zinc-400"
            >
              표시 이름
            </label>
            <input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-400"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-400"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="confirm"
              className="block text-xs font-medium text-zinc-400"
            >
              비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            가입하고 시작하기
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          이미 계정이 있나요?{" "}
          <Link
            href={`${prefix}/login`}
            className="font-medium text-teal-400 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
