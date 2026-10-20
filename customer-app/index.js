// App entry. Polyfills MUST load before anything else: the LiveKit / WebRTC packages need
// TextEncoder/TextDecoder at module-evaluation time and Hermes does not provide them.
import '@livekit/react-native/lib/commonjs/polyfills/EncoderDecoderTogether.min.js';
import { registerGlobals } from '@livekit/react-native';
try { registerGlobals(); } catch (e) { /* ignore: non-native runtime */ }
import 'expo-router/entry';
