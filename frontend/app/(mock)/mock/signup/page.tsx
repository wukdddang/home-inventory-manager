import { SignupProvider } from "./_context/SignupContext";
import { SignupPanel } from "./_ui/SignupPage.panel";

export default function SignupPage() {
  return (
    <SignupProvider>
      <SignupPanel />
    </SignupProvider>
  );
}
