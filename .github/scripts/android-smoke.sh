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
  grep -n -A18 "FATAL EXCEPTION" smoke-out/logcat.txt | head -45 | while IFS= read -r l; do echo "::error::${l:0:500}"; done
  grep -nE "ReactNativeJS|SoLoader|UnsatisfiedLink|Unable to load script|JavascriptException|Hermes|AndroidRuntime" smoke-out/logcat.txt | head -25 | while IFS= read -r l; do echo "::error::${l:0:500}"; done
  exit 1
fi
echo "App is running after 35 seconds."
grep -nE "ReactNativeJS" smoke-out/logcat.txt | head -10 || true
