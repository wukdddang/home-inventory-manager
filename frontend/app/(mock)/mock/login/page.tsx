"use client";

import { usePathname } from "next/navigation";
import { MockLoginProvider } from "./_context/LoginContext";
import { CurrentLoginProvider } from "@/app/(current)/login/_context/LoginContext";
import { LoginPanel } from "./_ui/LoginPage.panel";

export default function LoginPage() {
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockLoginProvider
    : CurrentLoginProvider;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <ProviderWrapper>
        <LoginPanel />
      </ProviderWrapper>
    </div>
  );
}
