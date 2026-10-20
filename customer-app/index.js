// App entry. Polyfills MUST load before anything else (module evaluation order matters on Hermes).
import './polyfills';
import { registerGlobals } from '@livekit/react-native';
try { registerGlobals(); } catch (e) { /* ignore: non-native runtime */ }
import 'expo-router/entry';
