import { SettingsProvider } from "./_context/SettingsContext";
import { SettingsPanel } from "./_ui/SettingsPage.panel";

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPanel />
    </SettingsProvider>
  );
}
