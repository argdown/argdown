export interface Command {
  readonly id: string;

  execute(...args: unknown[]): void | Promise<void>;
}
