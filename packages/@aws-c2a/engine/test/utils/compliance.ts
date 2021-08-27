export interface Suite {
  allow(test: () => void): void;
  deny(test: () => void): void;
}

export function behavior (name: string, cb: (suite: Suite) => void) {
  describe(name, () => {
    const todo = new Set(['allow', 'deny']);

    function scratchOff(flavor: string) {
      if (!todo.has(flavor)) {
        throw new Error(`Behavior for ${flavor} has already been processed.`);
      }
      todo.delete(flavor);
    }

    cb({
      allow: (testFn) => {
        scratchOff('allow');
        test('with allow policy statement is detected', testFn);
      },
      deny: (testFn) => {
        scratchOff('deny');
        test('with deny policy statement is ignored', testFn);
      },
    });
  });
}