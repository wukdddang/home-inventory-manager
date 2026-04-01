"use client";

import { AuthShowcaseSection } from "@/app/_ui/auth-showcase/AuthShowcase";
import { SignupFormSection } from "../SignupForm.section";

export function SignupPanel() {
  return (
    <div className="flex h-full w-full flex-1 flex-col lg:flex-row">
      <AuthShowcaseSection />
      <SignupFormSection />
    </div>
  );
}
