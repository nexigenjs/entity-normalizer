export class CanceledError extends Error {
  constructor(message = 'canceled') {
    super(message);
    this.name = 'CanceledError';
  }
}

export function isCanceled(err: unknown, signal?: AbortSignal | null): boolean {
  if (signal?.aborted) {
    return true;
  }

  if (!err || typeof err !== 'object') {
    return false;
  }
  const anyErr = err as any;

  // DOM / fetch
  if (anyErr?.name === 'AbortError') {
    return true;
  }

  // axios v1
  if (anyErr?.name === 'CanceledError') {
    return true;
  }
  if (anyErr?.code === 'ERR_CANCELED') {
    return true;
  }

  // internal
  if (err instanceof CanceledError) {
    return true;
  }

  return false;
}
