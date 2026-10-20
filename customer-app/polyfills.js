// Loaded first (see index.js). Hermes lacks these globals; LiveKit needs them while its modules evaluate.
import '@livekit/react-native/lib/commonjs/polyfills/EncoderDecoderTogether.min.js';

if (typeof global.DOMException === 'undefined') {
  class DOMExceptionShim extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
    }
  }
  global.DOMException = DOMExceptionShim;
}
