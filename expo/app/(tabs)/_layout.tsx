import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { AlarmClock, Pill, Users } from "lucide-react-native";
import { COLORS } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Tabs
        initialRouteName="alarms"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            borderTopWidth: 0.75,
            height: 78,
            paddingTop: 10,
            paddingBottom: 18,
          },
          tabBarActiveTintColor: COLORS.tabActive,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="alarms"
          options={{
            title: "Alarms",
            tabBarIcon: ({ color, size }) => <AlarmClock size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="meds"
          options={{
            title: "Meds",
            tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
