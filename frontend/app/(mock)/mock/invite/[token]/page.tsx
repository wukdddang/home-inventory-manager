"use client";

import { usePathname } from "next/navigation";
import { MockInviteProvider } from "./_context/InviteContext";
import { CurrentInviteProvider } from "@/app/(current)/invite/[token]/_context/InviteContext";
import { InvitePanel } from "./_ui/InvitePage.panel";

export default function InvitePage() {
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockInviteProvider
    : CurrentInviteProvider;

  return (
    <ProviderWrapper>
      <InvitePanel />
    </ProviderWrapper>
  );
}
