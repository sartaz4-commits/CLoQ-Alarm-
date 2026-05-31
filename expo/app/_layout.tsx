import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { setAudioModeAsync } from "expo-audio";
import { AppProvider } from "@/providers/AppProvider";
import { COLORS } from "@/constants/theme";
import { configureAlarmNotifications } from "@/utils/alarmNotifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="alarm-firing"
        options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="alarm-dismissed"
        options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="add-alarm"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="add-med"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="record-sound"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    // Configure audio session so alarms play even on silent / DND.
    // iOS: playsInSilentMode + doNotMix → AVAudioSessionCategoryPlayback.
    // Android: shouldRouteThroughEarpiece false + doNotMix → STREAM_ALARM-like behaviour.
    // Audio: full volume, no ducking, plays through silent / background.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: false,
      interruptionMode: "doNotMix",
      interruptionModeAndroid: "doNotMix",
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
    configureAlarmNotifications().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <StatusBar style="dark" />
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppProvider>
    </QueryClientProvider>
  );
}
