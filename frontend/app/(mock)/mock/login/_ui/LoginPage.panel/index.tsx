"use client";

import { LoginFormSection } from "../LoginForm.section";
import { LoginShowcaseSection } from "../LoginShowcase.section";

export function LoginPanel() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <LoginShowcaseSection />
      <LoginFormSection />
    </div>
  );
}
