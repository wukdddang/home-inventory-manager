import { SignupProvider } from "./_context/SignupContext";
import { SignupFormSection } from "./_ui/SignupForm.section";

export default function SignupPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <SignupProvider>
        <SignupFormSection />
      </SignupProvider>
    </div>
  );
}
