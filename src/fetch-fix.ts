// Universal fix to ensure window.fetch has a setter and suppress third-party extension property collisions
(function () {
  try {
    const win: any = typeof window !== 'undefined' ? window : globalThis;
    if (!win) return;

    // 1. Guard against third-party wallet extension "Cannot redefine property: ethereum"
    try {
      const origDefineProperty = Object.defineProperty;
      Object.defineProperty = function (obj: any, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>) {
        if (obj === win && prop === 'ethereum') {
          try {
            const existing = Object.getOwnPropertyDescriptor(win, 'ethereum');
            if (existing && !existing.configurable) {
              return obj;
            }
          } catch (_) {}
        }
        try {
          return origDefineProperty.call(Object, obj, prop, descriptor);
        } catch (err: any) {
          if (
            prop === 'ethereum' ||
            (err && typeof err.message === 'string' && (
              err.message.includes('Cannot redefine property: ethereum') ||
              err.message.includes('ethereum')
            ))
          ) {
            return obj;
          }
          throw err;
        }
      };

      let _eth: any;
      const ethDesc = Object.getOwnPropertyDescriptor(win, 'ethereum');
      if (!ethDesc || ethDesc.configurable) {
        Object.defineProperty(win, 'ethereum', {
          get() {
            return _eth;
          },
          set(val) {
            _eth = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    } catch (_) {}

    // Suppress [vite] and benign websocket noise in console
    try {
      const isTarget = (v: any) => {
        if (!v) return false;
        const str = typeof v === 'string' ? v : (v.message || String(v));
        return str.includes('[vite]') || str.includes('ethereum') || str.includes('websocket');
      };
      const methods = ['error', 'warn', 'log', 'info', 'debug'] as const;
      for (const m of methods) {
        const orig = (console as any)[m];
        if (typeof orig === 'function') {
          (console as any)[m] = function (...args: any[]) {
            for (const a of args) {
              if (isTarget(a)) return;
            }
            orig.apply(console, args);
          };
        }
      }
    } catch (_) {}

    // 2. Fix window.fetch setter accessors
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
