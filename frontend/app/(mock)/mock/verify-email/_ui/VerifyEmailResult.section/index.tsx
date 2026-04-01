"use client";

import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { useVerifyEmail } from "../../_hooks/useVerifyEmail";

export function VerifyEmailResultSection() {
  const { status, message } = useVerifyEmail();
  const prefix = useAppRoutePrefix();

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center shadow-xl shadow-black/40">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-400" />
            <h1 className="mt-4 text-xl font-semibold text-white">
              이메일 인증 중…
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              잠시만 기다려 주세요.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-teal-400" />
            <h1 className="mt-4 text-xl font-semibold text-white">
              인증 완료
            </h1>
            <p className="mt-2 text-sm text-zinc-300">{message}</p>
            <Link
              href={`${prefix}/login`}
              className="mt-6 inline-block w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400"
            >
              로그인하러 가기
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-400" />
            <h1 className="mt-4 text-xl font-semibold text-white">
              인증 실패
            </h1>
            <p className="mt-2 text-sm text-rose-300">{message}</p>
            <Link
              href={`${prefix}/signup`}
              className="mt-6 inline-block w-full rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
            >
              회원가입으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
