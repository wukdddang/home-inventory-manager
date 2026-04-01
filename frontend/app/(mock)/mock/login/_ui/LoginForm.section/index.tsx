"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { motion } from "framer-motion";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLogin } from "../../_hooks/useLogin";

export function LoginFormSection() {
  const prefix = useAppRoutePrefix();
  const { error, loading, 로그인을_제출_한다 } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    로그인을_제출_한다(email, password);
  };

  return (
    <section className="flex w-full flex-1 items-center justify-center bg-zinc-950 px-6 py-12 lg:max-w-md lg:flex-none xl:max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold text-white">로그인</h2>
        <p className="mt-1 text-sm text-zinc-300">
          이메일과 비밀번호를 입력하세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none ring-teal-500/40 placeholder:text-zinc-300 focus:border-teal-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-300"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none ring-teal-500/40 focus:border-teal-500 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-50"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-300">
          계정이 없으신가요?{" "}
          <Link
            href={`${prefix}/signup`}
            className="font-medium text-teal-400 hover:text-teal-300"
          >
            회원가입
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
