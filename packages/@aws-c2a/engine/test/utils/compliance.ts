export interface StatementSuite {
  allow(test: () => void): void;
  deny(test: () => void): void;
}

export interface SecurityGroupSuite {
  egress(test: () => void): void;
  ingress(test: () => void): void;
}

type Suite = StatementSuite & SecurityGroupSuite;

export function behavior(name: string, cb: (suite: Suite) => void) {
  describe(name, () => {
    const statementTodo = new Set(['allow', 'deny']);
    const securityGroupTodo = new Set(['egress', 'ingress']);

    function scratchOff(flavor: string, todo: Set<string>) {
      if (!todo.has(flavor)) {
        throw new Error(`Behavior for ${flavor} has already been processed.`);
      }
      todo.delete(flavor);
    }

    cb({
      allow: (testFn) => {
        scratchOff('allow', statementTodo);
        test('with allow policy statement is detected', testFn);
      },
      deny: (testFn) => {
        scratchOff('deny', statementTodo);
        test('with deny policy statement is ignored', testFn);
      },
      egress: (testFn) => {
        scratchOff('egress', securityGroupTodo);
        test('egress is detected', testFn);
      },
      ingress: (testFn) => {
        scratchOff('ingress', securityGroupTodo);
        test('ingress is detected', testFn);
      }
    });
  });
}