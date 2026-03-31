import { LoginShowcaseSection } from "@/app/(mock)/mock/login/_ui/LoginShowcase.section";
import { LoginProvider } from "./_context/LoginContext";
import { LoginFormSection } from "./_ui/LoginForm.section";

export default function LoginPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <LoginProvider>
        <div className="flex min-h-full w-full flex-col lg:min-h-0 lg:flex-row">
          <LoginShowcaseSection />
          <LoginFormSection />
        </div>
      </LoginProvider>
    </div>
  );
}
