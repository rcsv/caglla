// Polyfills for Node.js environment (must be loaded before any other modules)

// TextEncoder must be defined before importing undici
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

function TextEncoder() {
  return new (require('util').TextEncoder)()
}
function TextDecoder() {
  return new (require('util').TextDecoder)()
}

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

