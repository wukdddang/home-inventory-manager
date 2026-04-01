"use client";

import { LoginFormSection } from "../LoginForm.section";
import { LoginShowcaseSection } from "../LoginShowcase.section";

export function LoginPanel() {
  return (
    <div className="flex h-full w-full flex-1 flex-col lg:flex-row">
      <LoginShowcaseSection />
      <LoginFormSection />
    </div>
  );
}
