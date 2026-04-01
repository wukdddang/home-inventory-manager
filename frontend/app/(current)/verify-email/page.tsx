"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VerifyEmailProvider } from "./_context/VerifyEmailContext";
import { VerifyEmailResultSection } from "./_ui/VerifyEmailResult.section";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <VerifyEmailProvider token={token}>
      <VerifyEmailResultSection />
    </VerifyEmailProvider>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <Suspense
        fallback={
          <div className="flex min-h-full items-center justify-center bg-zinc-950">
            <p className="text-sm text-zinc-300">로딩 중…</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
