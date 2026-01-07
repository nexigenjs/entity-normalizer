import { type ExecutionIntent } from './types';

import type { PublicExecutionContext } from './public';

type ExecutionFrame = {
  intent: ExecutionIntent;
  signal: AbortSignal | null;
};

export class ExecutionContext {
  private stack: ExecutionFrame[] = [];

  private push(frame: ExecutionFrame) {
    this.stack.push(frame);
  }

  private pop() {
    this.stack.pop();
  }

  private current(): ExecutionFrame {
    return (
      this.stack[this.stack.length - 1] ?? {
        intent: 'normal',
        signal: null,
      }
    );
  }

  async withIntent<T>(
    intent: ExecutionIntent,
    fn: () => Promise<T>,
  ): Promise<T> {
    const parent = this.current();

    this.push({
      intent,
      signal: parent.signal,
    });

    try {
      return await fn();
    } finally {
      this.pop();
    }
  }

  is(intent: ExecutionIntent): boolean {
    return this.current().intent === intent;
  }

  async withAbort<T>(signal: AbortSignal, fn: () => Promise<T>): Promise<T> {
    const parent = this.current();

    this.push({
      intent: parent.intent,
      signal,
    });

    try {
      return await fn();
    } finally {
      this.pop();
    }
  }

  currentSignal(): AbortSignal | null {
    return this.current().signal;
  }
}

export function createExecutionContext(): PublicExecutionContext {
  return new ExecutionContext();
}

export const executionAsyncContext: PublicExecutionContext =
  createExecutionContext();
