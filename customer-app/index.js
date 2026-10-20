// App entry. Polyfills MUST load before any route file: livekit-client needs TextEncoder/TextDecoder
// at module-evaluation time and Hermes does not provide them.
import { registerGlobals } from '@livekit/react-native';
try { registerGlobals(); } catch (e) { /* ignore: non-native runtime */ }
import 'expo-router/entry';
