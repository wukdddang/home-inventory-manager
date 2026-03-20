import { SignupProvider } from "./_context/SignupContext";
import { SignupPanel } from "./_ui/SignupPage.panel";

export default function SignupPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <SignupProvider>
        <SignupPanel />
      </SignupProvider>
    </div>
  );
}
