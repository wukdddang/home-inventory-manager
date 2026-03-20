import { LoginProvider } from "./_context/LoginContext";
import { LoginPanel } from "./_ui/LoginPage.panel";

export default function LoginPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
      <LoginProvider>
        <LoginPanel />
      </LoginProvider>
    </div>
  );
}
