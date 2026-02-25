import { useAppTheme } from "@/contexts/SettingsContext";
import { StatusBar } from "expo-status-bar";

export function ThemedStatusBar() {
  const theme = useAppTheme();

  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}
