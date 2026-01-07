# Changelog

All notable changes to this project will be documented in this file.

The format follows:

- Added
- Changed
- Fixed
- Removed

---

## 0.4.0

### Added
- Stable AsyncDuck cancellation model
- `executionAsyncContext` for propagating:
  - cancellation (`AbortSignal`)
  - execution intent (`normal`, `refresh`)
- Abort-safe retry engine with observable `isRetrying`
- Explicit execution intent support (`refresh`)

### Changed
- AsyncDuck lifecycle semantics clarified:
  - cancellation does not set error
  - retry is fully abort-aware
- `refresh()` explicitly invalidates previous execution
- Execution intent preserved across async boundaries

### Fixed
- Race conditions between cancel / retry / refresh
- Error state being set after aborted executions
- Retry delays continuing after cancellation
- Inconsistent loading state on cancel

### Notes
- Cancellation is not considered an error
- Abort signal is automatically available to all ducks
- Transport layer needs to wire cancellation only once

---

## 0.3.1

### Changed
- Switched RootStore lifecycle to explicit MobX annotations
- Lifecycle access restricted to `core.lifecycle`

### Fixed
- RootStore lifecycle observability inconsistencies

### Notes
- RootStore lifecycle is internal and not part of public API

---

## 0.3.0

### Added
- Core plugin infrastructure
- RootStore lifecycle management

### Fixed
- RootStore initialization order
- Plugin registration and extension mechanism
- Store reset and snapshot restore flow
- Excessive persistence notifications

### Improved
- Core plugin architecture stability
- Decoupled Core from plugin-specific APIs
- Simplified StoreManager and Cleaner responsibilities

---

## 0.2.1

### Fixed
- npm publishing issues
- CI install instability (`yarn install --frozen-lockfile`)

### Notes
- Infrastructure-only release
- No runtime or API changes

---

## 0.2.0

### Added
- Optimistic identity resolution:
  - `EntityCollection.resolveById`
  - `EntityRecord.resolve`

### Notes
- Designed for optimistic and offline-first flows
- No breaking changes

---

## 0.1.6

### Fixed
- Web crash caused by React Native–specific `__DEV__` global

---

## 0.1.4

### Changed
- Added npm keywords
- Added `sideEffects: false` for better tree-shaking
- Made Husky setup non-blocking

### Notes
- Safe patch release
- No runtime or API changes

---

## 0.1.3

### Changed
- Improved npm and repository metadata

### Fixed
- npm package page links
- Release process inconsistencies

---

## 0.1.2

### Fixed
- CI/CD and npm publish pipeline issues

---

## 0.1.0

### Added
- Initial public release
- Entity schema system
- Normalized entity store
- EntityRecord and EntityCollection
- MultiEntityCollection
- Async Ducks
- RootStore and Core API
- Dependency Injection (StoreDeps)
- React integration hooks
- Deterministic entity lifecycle
- Full test coverage for core logic

---

> Versions below 1.0.0 may contain breaking changes.
