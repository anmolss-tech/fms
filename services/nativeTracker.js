import { Platform } from "react-native";
import ProcrastinationTrackerModule from "../modules/procrastination-tracker";

const NativeTracker = Platform.OS === "android" ? ProcrastinationTrackerModule : null;

export function isNativeTrackerAvailable() {
  return Boolean(NativeTracker);
}

export async function getOwnPackageName() {
  if (!NativeTracker) return null;
  return NativeTracker.getPackageName();
}

export async function getDeviceLabel() {
  if (!NativeTracker) return "Android device";
  const value = await NativeTracker.getDeviceLabel();
  return String(value || "Android device");
}

export async function hasUsageAccess() {
  if (!NativeTracker) return false;
  return NativeTracker.hasUsageAccess();
}

export async function openUsageAccessSettings() {
  if (!NativeTracker) return false;
  return NativeTracker.openUsageAccessSettings();
}

export async function getUsageEvents(startMs, endMs) {
  if (!NativeTracker) return [];
  return NativeTracker.getUsageEvents(Number(startMs), Number(endMs));
}

export async function hasCallLogPermission() {
  if (!NativeTracker) return false;
  return NativeTracker.hasCallLogPermission();
}

export async function hasContactsPermission() {
  if (!NativeTracker) return false;
  return NativeTracker.hasContactsPermission();
}

export async function getPhoneCalls(startMs) {
  if (!NativeTracker) return [];
  return NativeTracker.getPhoneCalls(Number(startMs));
}

export async function getPhoneNotificationEvents() {
  if (!NativeTracker) return [];
  return NativeTracker.getPhoneNotificationEvents();
}

export async function hasNotificationListenerAccess() {
  if (!NativeTracker) return false;
  return NativeTracker.hasNotificationListenerAccess();
}

export async function openNotificationListenerSettings() {
  if (!NativeTracker) return false;
  return NativeTracker.openNotificationListenerSettings();
}

export async function getWhatsAppCallEvents() {
  if (!NativeTracker) return [];
  return NativeTracker.getWhatsAppCallEvents();
}

export async function setPandaIcon(state) {
  if (!NativeTracker) return "unavailable";
  return NativeTracker.setPandaIcon(state);
}

export async function getPandaState() {
  if (!NativeTracker) return "unavailable";
  return NativeTracker.getPandaState();
}

export async function notifyAppForeground() {
  if (!NativeTracker) return false;
  return NativeTracker.onAppForeground();
}

export async function notifyAppBackground() {
  if (!NativeTracker) return false;
  return NativeTracker.onAppBackground();
}

export async function setPandaTestMode(enabled) {
  if (!NativeTracker) return false;
  return NativeTracker.setPandaTestMode(Boolean(enabled));
}

export async function getPandaTestMode() {
  if (!NativeTracker) return false;
  return NativeTracker.getPandaTestMode();
}

export async function getPandaStatus() {
  if (!NativeTracker) {
    return { state: "unavailable", foreground: true, testMode: false, lastBackgroundAt: 0 };
  }
  return NativeTracker.getPandaStatus();
}
