#!/usr/bin/env bash
# Installs an APK on the running emulator, launches it, drives a few taps and reports whether it survived.
#   usage: PKG=ng.chowbuy.customer EXPECT_FIRST="Skip" TAPS="Next,Next,Next" EXPECT_AFTER="Get started" android-smoke.sh app.apk
# Crash details and failed UI expectations are printed as GitHub annotations so they can be read without downloading logs.
APK="$1"; PKG="${PKG:-ng.chowbuy.customer}"
mkdir -p smoke-out
adb install -r "$APK" 2>&1 | tail -2
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 25

dump() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml smoke-out/ui.xml >/dev/null 2>&1; }
# prints "x y" of the centre of the first node whose text or content-desc equals $1
find_xy() { python3 - "$1" <<'PY'
import re, sys, xml.etree.ElementTree as ET
want = sys.argv[1]
try: root = ET.parse('smoke-out/ui.xml').getroot()
except Exception: sys.exit(1)
for n in root.iter('node'):
    if want in (n.get('text'), n.get('content-desc')):
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', n.get('bounds', ''))
        if m:
            a, b, c, d = map(int, m.groups()); print((a + c) // 2, (b + d) // 2); sys.exit(0)
sys.exit(1)
PY
}
fail() { echo "::error::$1"; exit 1; }
crashed() { [ -z "$(adb shell pidof "$PKG" | tr -d '\r')" ] || grep -q "FATAL EXCEPTION" smoke-out/logcat.txt 2>/dev/null; }

report_crash() {
  adb logcat -d -v threadtime > smoke-out/logcat.txt 2>&1
  echo "::error::APP CRASHED ON LAUNCH"
  # one compact annotation: annotations are capped at 10 per step
  S=$(grep -A40 "FATAL EXCEPTION" smoke-out/logcat.txt | sed -E 's/^[0-9-]+ [0-9:.]+ +[0-9]+ +[0-9]+ [A-Z] //' | cut -c1-160 | tr '\n' '~' | cut -c1-3800)
  echo "::error::${S}"
  echo "::error::JS: $(grep -E 'ReactNativeJS' smoke-out/logcat.txt | head -8 | cut -c1-300 | tr '\n' '~')"
  exit 1
}

adb logcat -d -v threadtime > smoke-out/logcat.txt 2>&1
if crashed; then report_crash; fi

if [ -n "$EXPECT_FIRST" ]; then
  dump; adb exec-out screencap -p > smoke-out/screen1.png 2>/dev/null || true
  find_xy "$EXPECT_FIRST" >/dev/null || fail "UI check failed: '$EXPECT_FIRST' not found on the first screen. Visible: $(grep -oE '(text|content-desc)="[^"]+"' smoke-out/ui.xml | head -25 | tr '\n' ' ' | cut -c1-900)"
  echo "first screen shows '$EXPECT_FIRST'"
fi
IFS=',' read -ra TAPLIST <<< "$TAPS"
for t in "${TAPLIST[@]}"; do
  [ -z "$t" ] && continue
  dump; XY=$(find_xy "$t") || fail "UI check failed: nothing to tap labelled '$t'. Visible: $(grep -oE '(text|content-desc)="[^"]+"' smoke-out/ui.xml | head -25 | tr '\n' ' ' | cut -c1-900)"
  adb shell input tap $XY; echo "tapped '$t' at $XY"; sleep 3
done
if [ -n "$EXPECT_AFTER" ]; then
  dump; adb exec-out screencap -p > smoke-out/screen2.png 2>/dev/null || true
  find_xy "$EXPECT_AFTER" >/dev/null || fail "UI check failed: '$EXPECT_AFTER' not found after the taps. Visible: $(grep -oE '(text|content-desc)="[^"]+"' smoke-out/ui.xml | head -25 | tr '\n' ' ' | cut -c1-900)"
  echo "after taps shows '$EXPECT_AFTER'"
fi
sleep 5
adb logcat -d -v threadtime > smoke-out/logcat.txt 2>&1
if crashed; then report_crash; fi
echo "App is running and responsive."
