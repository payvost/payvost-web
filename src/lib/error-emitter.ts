
import { EventEmitter } from 'events';

// A simple event emitter for global error handling.
// This is a browser-only implementation.
class ErrorEmitter extends EventEmitter {}

// Ensure this is a singleton in the browser environment.
const getErrorEmitter = () => {
  if (typeof window !== 'undefined') {
    // Use a global symbol to ensure only one instance exists.
    const globalSymbol = Symbol.for('firebase_studio_error_emitter');
    if (!(globalSymbol in window)) {
      (window as any)[globalSymbol] = new ErrorEmitter();
    }
    return (window as any)[globalSymbol];
  }
  // Return a dummy emitter for server-side rendering to avoid errors.
  return new ErrorEmitter();
};

export const errorEmitter = getErrorEmitter();
