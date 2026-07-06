// vitest-setup.ts — Polyfill localStorage for test environment
// Required because jsdom environment is not providing localStorage in some test contexts

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  const localStoragePolyfill: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStoragePolyfill,
    writable: true,
    configurable: true
  });
}
