import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { initDatabase } from "../database/db";
import { notifyAppBackground, notifyAppForeground } from "../services/nativeTracker";
import { refreshTracker } from "../services/refreshService";
import { finishActiveFrenchSession, startFrenchSession } from "../services/sessionService";

export default function useTrackerLifecycle() {
  const appState = useRef(AppState.currentState);
  const refreshing = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function handleForeground() {
      try {
        await initDatabase();
        await notifyAppForeground();
        await startFrenchSession();
        if (!refreshing.current && mounted) {
          refreshing.current = true;
          refreshTracker().finally(() => {
            refreshing.current = false;
          });
        }
      } catch (error) {
        console.log("Tracker foreground setup failed:", error);
      }
    }

    async function handleBackground() {
      try {
        await finishActiveFrenchSession();
        await notifyAppBackground();
      } catch (error) {
        console.log("Tracker background setup failed:", error);
      }
    }

    handleForeground();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appState.current;
      appState.current = nextState;

      if (nextState === "active" && previous !== "active") {
        handleForeground();
      } else if (nextState === "background" && previous === "active") {
        handleBackground();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
}
