import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useApp } from "@/providers/AppProvider";
import { COLORS } from "@/constants/theme";

export default function Index() {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return <Redirect href="/(tabs)/alarms" />;
}
