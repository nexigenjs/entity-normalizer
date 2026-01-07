## Execution Context

Nexigen uses `executionAsyncContext` to propagate **execution intent** and **abort signals**
through async boundaries.

This allows lower layers (transport, cache, retry) to adjust behavior
without polluting public APIs.

Each execution may also expose an `AbortSignal`, enabling cancellation
to be handled transparently by the underlying transport layer.

Example intents:

- normal
- refresh

Typical use cases:

- bypassing TTL cache on refresh
- background revalidation
- reconnect / retry flows
- request cancellation on unmount or invalidation
