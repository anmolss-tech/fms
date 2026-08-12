import { requireNativeModule } from "expo";

let nativeModule = null;

try {
  nativeModule = requireNativeModule("ProcrastinationTracker");
} catch (error) {
  // Expo Go and non-Android platforms will not contain the custom Kotlin module.
  nativeModule = null;
}

export default nativeModule;
