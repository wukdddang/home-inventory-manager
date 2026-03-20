"use client";

import { LoginFormSection } from "../LoginForm.section";
import { LoginShowcaseSection } from "../LoginShowcase.section";

export function LoginPanel() {
  return (
    <div className="flex min-h-full w-full flex-col lg:min-h-0 lg:flex-row">
      <LoginShowcaseSection />
      <LoginFormSection />
    </div>
  );
}
