import { Stack } from "expo-router";
import { COLORS } from "../constants/theme";
import useTrackerLifecycle from "../hooks/useTrackerLifecycle";

export default function RootLayout() {
  useTrackerLifecycle();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: COLORS.cream },
        headerStyle: { backgroundColor: COLORS.cypress },
        headerTintColor: COLORS.cream,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false
      }}
    >
      <Stack.Screen name="index" options={{ title: "French Made Simple" }} />
      <Stack.Screen name="sentences/index" options={{ title: "French - KieranBall" }} />
      <Stack.Screen name="grammar/index" options={{ title: "Grammar" }} />
      <Stack.Screen name="grammar/[category]" options={{ title: "Grammar Sources" }} />
      <Stack.Screen name="grammar/topics/[sourceId]" options={{ title: "Grammar Topics" }} />
      <Stack.Screen name="ccube/index" options={{ title: "Ccube" }} />
      <Stack.Screen name="songs/index" options={{ title: "Songs" }} />
      <Stack.Screen name="levels/[type]" options={{ title: "Levels" }} />
      <Stack.Screen name="practice/[type]" options={{ title: "Practice" }} />
      <Stack.Screen name="activity/index" options={{ title: "My Activity" }} />
      <Stack.Screen name="activity/settings" options={{ title: "Tracker Settings" }} />
      <Stack.Screen name="activity/categories" options={{ title: "App Categories" }} />
    </Stack>
  );
}
