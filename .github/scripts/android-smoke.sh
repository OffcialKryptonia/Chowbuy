#!/usr/bin/env bash
# Installs the APK on the running emulator, launches it, waits, and reports whether it survived.
# Crash details are printed as GitHub annotations so they can be read without downloading logs.
APK="$1"; PKG=ng.chowbuy.customer
mkdir -p smoke-out
adb install -r "$APK" 2>&1 | tail -2
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 35
adb exec-out screencap -p > smoke-out/screen.png 2>/dev/null || true
adb logcat -d -v threadtime > smoke-out/logcat.txt 2>&1
PID=$(adb shell pidof "$PKG" | tr -d '\r')
echo "pid after 35s: ${PID:-none}"
if [ -z "$PID" ] || grep -q "FATAL EXCEPTION" smoke-out/logcat.txt; then
  echo "::error::APP CRASHED ON LAUNCH"
  # one compact annotation: annotations are capped at 10 per step
  S=$(grep -A40 "FATAL EXCEPTION" smoke-out/logcat.txt | sed -E 's/^[0-9-]+ [0-9:.]+ +[0-9]+ +[0-9]+ [A-Z] //' | cut -c1-160 | tr '\n' '~' | cut -c1-3800)
  echo "::error::${S}"
  echo "::error::JS: $(grep -E 'ReactNativeJS' smoke-out/logcat.txt | head -8 | cut -c1-300 | tr '\n' '~')"
  exit 1
fi
echo "App is running after 35 seconds."
grep -nE "ReactNativeJS" smoke-out/logcat.txt | head -10 || true
