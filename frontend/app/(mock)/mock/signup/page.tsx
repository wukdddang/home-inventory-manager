"use client";

import { usePathname } from "next/navigation";
import { MockSignupProvider } from "./_context/SignupContext";
import { CurrentSignupProvider } from "@/app/(current)/signup/_context/SignupContext";
import { SignupPanel } from "./_ui/SignupPage.panel";

export default function SignupPage() {
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockSignupProvider
    : CurrentSignupProvider;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <ProviderWrapper>
        <SignupPanel />
      </ProviderWrapper>
    </div>
  );
}
