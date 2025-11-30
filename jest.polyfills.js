// Polyfills for Node.js environment (must be loaded before any other modules)

// TextEncoder/TextDecoder polyfill
const {
	TextEncoder: NodeTextEncoder,
	TextDecoder: NodeTextDecoder,
} = require("util");

if (typeof global.TextEncoder === "undefined") {
	global.TextEncoder = NodeTextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
	global.TextDecoder = NodeTextDecoder;
}

// ReadableStream polyfill for @firebase/rules-unit-testing
if (typeof global.ReadableStream === "undefined") {
	// Node.js 18+ has ReadableStream built-in, but for older versions we need a polyfill
	try {
		const { ReadableStream } = require("stream/web");
		global.ReadableStream = ReadableStream;
	} catch (e) {
		// If stream/web is not available, use a minimal polyfill
		// Note: This is a very basic implementation and may not work for all use cases
		global.ReadableStream = class ReadableStream {
			constructor() {
				throw new Error("ReadableStream polyfill not fully implemented");
			}
		};
	}
}

// setImmediate polyfill for gRPC (required by @grpc/grpc-js)
if (typeof global.setImmediate === "undefined") {
	global.setImmediate = function (callback, ...args) {
		return setTimeout(callback, 0, ...args);
	};
	global.clearImmediate = function (id) {
		clearTimeout(id);
	};
}
