import React, { useState } from "react";
import { Alert, FlatList, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Bell, Copy, HandHelping, Share2, Trash2, UserPlus } from "lucide-react-native";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { Friend } from "@/types";
import { formatTime } from "@/utils/time";

export default function FriendsScreen() {
  const { friends, settings, alarms, addFriendByCode, removeFriend, sendNudge, sendWakeRequest, updateSettings, wakeRequests, respondToRequest } = useApp();
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>(settings.displayName ?? "");
  const [selectingFriend, setSelectingFriend] = useState<boolean>(false);

  const nextAlarm = alarms.find((a) => a.enabled);

  const tryAddFriend = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert("Invalid code", "Friend codes are 6 characters.");
      return;
    }
    const f = await addFriendByCode(trimmed);
    if (!f) {
      Alert.alert("Couldn't add friend", "Code not found or already added.");
      return;
    }
    setCode("");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareCode = async () => {
    const msg = `Wake up with me on CloQ. My friend code: ${settings.myCode ?? ""}\nDownload CloQ to connect.`;
    try {
      await Share.share({ message: msg });
    } catch {
    }
  };

  const onSendNudge = (f: Friend) => {
    const ok = sendNudge(f.id);
    if (!ok) {
      Alert.alert("Already nudged today", "You can nudge each friend once per day.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Nudge sent", `${f.name} will get a wake-up nudge.`);
  };

  const askFriend = (f: Friend) => {
    if (!nextAlarm) {
      Alert.alert("No alarm set", "Create an alarm first so we know when to nudge.");
      return;
    }
    const t = formatTime(nextAlarm.hour, nextAlarm.minute);
    sendWakeRequest(f.id, t);
    setSelectingFriend(false);
    Alert.alert("Request sent", `${f.name} will be asked to nudge you at ${t}.`);
  };

  const incoming = wakeRequests.filter((r) => !r.outgoing && r.status === "pending");

  const header = (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.sub}>Wake up together, gently.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Your display name</Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t.slice(0, 24)); updateSettings({ displayName: t.slice(0, 24) }); }}
          placeholder="e.g. Sam"
          placeholderTextColor={COLORS.textDim}
          style={styles.input}
          maxLength={24}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>Your friend code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{settings.myCode ?? "------"}</Text>
          <Pressable onPress={shareCode} style={styles.iconAction} testID="share-code">
            <Share2 size={16} color={COLORS.creamLight} />
            <Text style={styles.iconActionText}>Share</Text>
          </Pressable>
        </View>
        <Text style={styles.tip}>Codes expire after 48h if unused. Display names only — no real names required.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Add a friend by code</Text>
        <View style={styles.codeRow}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            placeholderTextColor={COLORS.textDim}
            autoCapitalize="characters"
            style={[styles.input, { flex: 1 }]}
            maxLength={6}
          />
          <Pressable onPress={tryAddFriend} style={styles.iconAction} testID="add-friend">
            <UserPlus size={16} color={COLORS.creamLight} />
            <Text style={styles.iconActionText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {incoming.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>Incoming wake-up requests</Text>
          {incoming.map((r) => (
            <View key={r.id} style={styles.requestRow}>
              <Text style={styles.requestText}>{r.friendName} is asking you to nudge them at {r.time}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => respondToRequest(r.id, true)} style={styles.acceptBtn}><Text style={styles.acceptText}>Accept</Text></Pressable>
                <Pressable onPress={() => respondToRequest(r.id, false)} style={styles.declineBtn}><Text style={styles.declineText}>Decline</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={() => setSelectingFriend((v) => !v)} style={styles.helpBtn} testID="ask-friend">
        <HandHelping size={16} color={COLORS.creamLight} />
        <Text style={styles.helpText}>{selectingFriend ? "Cancel" : "Ask a friend to wake me up"}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>My friends</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <GrainBackground decor={["star", "horseshoe"]} />
      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <FriendRow
            friend={item}
            selecting={selectingFriend}
            onNudge={() => onSendNudge(item)}
            onAsk={() => askFriend(item)}
            onRemove={() => {
              Alert.alert(item.name, "Remove friend?", [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => removeFriend(item.id) },
              ]);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyBody}>Share your code or enter a friend&apos;s code to connect.</Text>
          </View>
        }
        ListFooterComponent={<Text style={styles.disclaimer}>All friend connections are opt-in. No contacts accessed without permission.</Text>}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function FriendRow({ friend, selecting, onNudge, onAsk, onRemove }: { friend: Friend; selecting: boolean; onNudge: () => void; onAsk: () => void; onRemove: () => void }) {
  const statusLabel = friend.status === "set" ? "Alarm set" : friend.status === "snoozed" ? "Snoozed today" : "No alarm set";
  return (
    <Pressable onLongPress={onRemove} delayLongPress={500} style={styles.friendCard} testID={`friend-${friend.id}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendMeta}>{friend.alarmTime ? `Tomorrow at ${friend.alarmTime} · ` : ""}{statusLabel}</Text>
      </View>
      {selecting ? (
        <Pressable onPress={onAsk} style={styles.askBtn}><Text style={styles.askText}>Ask</Text></Pressable>
      ) : (
        <Pressable onPress={onNudge} style={styles.bellBtn} testID={`nudge-${friend.id}`}>
          <Bell size={18} color={COLORS.creamLight} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40, gap: 0 },
  title: { color: COLORS.cream, fontSize: 28, fontWeight: "700", fontFamily: FONTS.display, letterSpacing: -0.3 },
  sub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.lg, padding: 16, gap: 8 },
  label: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: "800" },
  input: { backgroundColor: COLORS.borderLight, borderColor: COLORS.border, borderWidth: 0.5, borderRadius: RADIUS.md, padding: 12, color: COLORS.text, fontSize: 15 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeText: { color: COLORS.cream, fontSize: 22, fontWeight: "800", letterSpacing: 4, fontFamily: FONTS.display, flex: 1 },
  iconAction: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  iconActionText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 12 },
  tip: { color: COLORS.textDim, fontSize: 11, marginTop: 4, fontStyle: "italic" },
  helpBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.warmDeep, marginTop: 4 },
  helpText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 14 },
  empty: { padding: 28, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, alignItems: "center", gap: 6, marginTop: 8 },
  emptyTitle: { color: COLORS.cream, fontWeight: "700", fontSize: 15 },
  emptyBody: { color: COLORS.textMuted, fontSize: 12, textAlign: "center" },
  friendCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.lg, gap: 12 },
  friendName: { color: COLORS.cream, fontSize: 15, fontWeight: "700" },
  friendMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.warmDeep, alignItems: "center", justifyContent: "center" },
  askBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.warm },
  askText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  requestRow: { gap: 8, borderTopWidth: 0.5, borderTopColor: COLORS.borderLight, paddingTop: 10 },
  requestText: { color: COLORS.text, fontSize: 13 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.success },
  acceptText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 12 },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.sienna },
  declineText: { color: COLORS.sienna, fontWeight: "800", fontSize: 12 },
  disclaimer: { color: COLORS.textDim, fontSize: 11, textAlign: "center", marginTop: 16, fontStyle: "italic" },
});
