// Universal fix to ensure window.fetch has a setter across window and its prototype chain
(function () {
  try {
    const win = typeof window !== 'undefined' ? window : globalThis;
    if (!win) return;

    let currentFetch = win.fetch;

    function defineAccessor(target: any) {
      if (!target) return false;
      try {
        const desc = Object.getOwnPropertyDescriptor(target, 'fetch');
        if (desc && (desc.configurable || (desc.get && !desc.set))) {
          Object.defineProperty(target, 'fetch', {
            get() {
              return currentFetch;
            },
            set(val) {
              currentFetch = val;
            },
            configurable: true,
            enumerable: desc.enumerable !== false,
          });
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    }

    // Walk prototype chain
    let p: any = win;
    while (p) {
      defineAccessor(p);
      p = Object.getPrototypeOf(p);
    }

    if (typeof Window !== 'undefined' && Window.prototype) {
      defineAccessor(Window.prototype);
      const winProto = Object.getPrototypeOf(Window.prototype);
      if (winProto) defineAccessor(winProto);
    }

    try {
      Object.defineProperty(win, 'fetch', {
        get() {
          return currentFetch;
        },
        set(val) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true,
      });
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
})();

export {};
