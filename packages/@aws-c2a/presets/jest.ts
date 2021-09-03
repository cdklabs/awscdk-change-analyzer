export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toContainObject(arg: any): R;
    }
  }
}

expect.extend({
  toContainObject(received, arg) {
    const pass = this.equals(received,
      expect.arrayContaining([
        expect.objectContaining(arg),
      ]),
    );

    if (pass) {
      return {
        message: () => (`expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(arg)}`),
        pass: true,
      };
    } else {
      return {
        message: () => (`expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(arg)}`),
        pass: false,
      };
    }
  },
});