import { EventEmitter } from 'events';

/**
 * Global Realtime Emitter for database mutation broadcasts.
 */
export const realtimeEmitter = new EventEmitter();
