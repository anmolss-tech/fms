#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

APP_NAME="French-Made-Simple-Tracker"
PROFILE="${EAS_PROFILE:-preview}"
OUTPUT_DIR="$ROOT_DIR/build-output"

say() { printf '\n🐼 %s\n' "$1"; }
fail() { printf '\n❌ %s\n' "$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required."
command -v npm >/dev/null 2>&1 || fail "npm is required."
command -v java >/dev/null 2>&1 || fail "Java is required for an Android local build."

if ! command -v eas >/dev/null 2>&1; then
  fail "EAS CLI is required. Install it with: npm install -g eas-cli"
fi

say "Checking Expo/EAS login"
eas whoami >/dev/null || fail "Log in first with: eas login"
echo "EAS account: $(eas whoami | head -n 1)"

# Common Android SDK location on macOS. Existing environment variables win.
if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Library/Android/sdk" ]]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
if [[ -n "${ANDROID_HOME:-}" ]]; then
  export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
fi

say "Building French Made Simple APK locally"
echo "Project: $ROOT_DIR"
echo "EAS profile: $PROFILE"
echo "ANDROID_HOME: ${ANDROID_HOME:-not set}"

say "Installing project dependencies and creating/updating package-lock.json"
npm install

say "Checking Expo project health"
npx expo-doctor

say "Checking Android JavaScript bundle"
rm -rf "$ROOT_DIR/dist-build-check"
npx expo export --platform android --output-dir "$ROOT_DIR/dist-build-check"
rm -rf "$ROOT_DIR/dist-build-check"

say "Preparing APK output directory"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

say "Starting local EAS Android APK build"
EAS_LOCAL_BUILD_ARTIFACTS_DIR="$OUTPUT_DIR" \
  eas build --platform android --profile "$PROFILE" --local

APK_PATH="$(find "$OUTPUT_DIR" -type f -name '*.apk' -print | head -n 1 || true)"
[[ -n "$APK_PATH" ]] || fail "Build finished but no .apk was found in $OUTPUT_DIR"

VERSION="$(node -p "require('./package.json').version")"
FINAL_APK="$OUTPUT_DIR/${APP_NAME}-v${VERSION}.apk"
if [[ "$APK_PATH" != "$FINAL_APK" ]]; then
  mv "$APK_PATH" "$FINAL_APK"
fi

say "APK ready"
echo "$FINAL_APK"
echo
echo "Share this .apk with an Android device and install it normally."
