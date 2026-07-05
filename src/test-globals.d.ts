declare function describe(name:string, fn:()=>void): void;
declare function it(name:string, fn:()=>void|Promise<void>): void;
declare function beforeEach(fn:()=>void|Promise<void>): void;
declare function afterEach(fn:()=>void|Promise<void>): void;

interface TestMatchers {
  toBe(expected:unknown): void;
  toEqual(expected:unknown): void;
  toHaveLength(expected:number): void;
  toBeGreaterThanOrEqual(expected:number): void;
  toBeLessThanOrEqual(expected:number): void;
  toBeNull(): void;
  not: TestMatchers;
}

declare function expect(actual:unknown): TestMatchers;

declare const jest: {
  spyOn<T extends object, K extends keyof T>(target:T, key:K): {mockReturnValue(value:unknown): void};
  restoreAllMocks(): void;
};
