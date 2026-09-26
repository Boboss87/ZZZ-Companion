import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { Loading, ToastProvider } from "@/src/components/ui";
import { queryClient } from "@/src/query-client";
import { AppStoreProvider, useStore } from "@/src/store/AppStore";
import { applyThemeMode, ThemeSchemeProvider, useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue: require("../assets/fonts/BebasNeue-Regular.ttf"),
    IBMPlexSans: require("../assets/fonts/IBMPlexSans-Regular.ttf"),
    "IBMPlexSans-Medium": require("../assets/fonts/IBMPlexSans-Medium.ttf"),
    "IBMPlexSans-SemiBold": require("../assets/fonts/IBMPlexSans-SemiBold.ttf"),
  });

  const ready = fontsLoaded || !!fontError;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <AppStoreProvider>
                <ThemedShell ready={ready} />
              </AppStoreProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function ThemedShell({ ready }: { ready: boolean }) {
  const { state } = useStore();
  return (
    <ThemeSchemeProvider mode={state.settings.themeMode}>
      <InnerChrome ready={ready} mode={state.settings.themeMode} />
    </ThemeSchemeProvider>
  );
}

function InnerChrome({ ready, mode }: { ready: boolean; mode: "light" | "dark" | "system" }) {
  const { scheme, colors } = useTheme();

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  return (
    <ToastProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {ready ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="agent/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="farm/objective" options={{ presentation: "card" }} />
          <Stack.Screen name="backup" options={{ presentation: "card" }} />
          <Stack.Screen name="projection" options={{ presentation: "card" }} />
          <Stack.Screen name="history" options={{ presentation: "card" }} />
        </Stack>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <Loading label="LOADING..." />
        </View>
      )}
    </ToastProvider>
  );
}
