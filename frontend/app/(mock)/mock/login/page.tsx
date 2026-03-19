import { LoginProvider } from "./_context/LoginContext";
import { LoginPanel } from "./_ui/LoginPage.panel";

export default function LoginPage() {
  return (
    <LoginProvider>
      <LoginPanel />
    </LoginProvider>
  );
}
