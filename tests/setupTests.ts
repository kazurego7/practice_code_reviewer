import '@testing-library/jest-dom';

if (typeof global.setImmediate === 'undefined') {
  // JSDOM 環境では setImmediate が未定義のため、タイマーを代替する
  (global as any).setImmediate = (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    setTimeout(fn as TimerHandler, 0, ...args);
}

if (typeof global.clearImmediate === 'undefined') {
  (global as any).clearImmediate = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
}
