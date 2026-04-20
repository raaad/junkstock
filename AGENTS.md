# Junkstock: AI Agent Guidelines

This Angular 21 app showcases modern patterns for file uploading, 3D rendering, SVG rendering, internationalization, and utilities. The codebase prioritizes zoneless change detection, signals-based reactivity, and functional dependency injection.

## Essential Commands

| Task                         | Command          |
| ---------------------------- | ---------------- |
| Start dev server (port 5000) | `npm start`      |
| Production build             | `npm run build`  |
| Linting                      | `npm run lint`   |
| Formatting                   | `npm run pretty` |

## Architecture & Code Organization

### Module Structure

- **`src/app/`** — Feature components and route views (3d, svg-render, upload, utils, i18n, misc)
- **`src/core/`** — Shared services and utilities:
  - `angular/` — Logger, directives, i18n, event plugins
  - `upload/` — Upload pipeline, RxJS operators, state management
  - `3d/` — Three.js utilities and loaders
  - `svg-renderer/` — SVG rendering engine
  - `types/` — Shared TypeScript definitions
  - `utils/` — General utilities (crypto, date, file, math, traverse, lazy)

### Path Aliases

```typescript
@core/3d, @core/angular, @core/svg-renderer, @core/upload, @core/utils,
@core/types, @core/angular/i18n
```

## Key Technical Patterns

### 1. **Zoneless Change Detection + Signals**

- Uses `provideZonelessChangeDetection()` — avoids zone.js overhead
- Heavy use of Angular Signals: `signal()`, `computed()`, `toSignal()`
- Pattern: `toSignal()` bridges legacy RxJS observables to signals

```typescript
readonly uploads = toSignal(this.uploads$, { initialValue: [] });
readonly active = computed(() => this.uploads().filter(/* ... */));
```

**When to use**: Avoid direct zone manipulation; use signals for state and computed for derived values.

### 2. **Functional Dependency Injection**

- Modern approach using `inject()` instead of constructor parameters
- Factory providers via `useFactory` for runtime configuration
- Custom injection tokens: `UPLOAD_PIPELINE`, `LOGGER`, `svg-renderer` token

```typescript
export function provideUploadPipeline(): FactoryProvider {
  return { provide: UPLOAD_PIPELINE, useFactory: (): UploadPipeline => {...} };
}
```

### 3. **RxJS Operator Pipelines**

- Upload pipeline composed of custom operators: `validate()`, `clientThumb()`, `upload()`, etc.
- Abort handling via observable subjects
- Pattern: Operators accept logging and abort$ parameters for control flow

```typescript
source.pipe(
  preProcessing(file => ..., log, abort$),
  validate(..., log, abort$),
  // ... more operators
)
```

### 4. **Lazy Evaluation**

- `lazy()` utility for deferred computation — useful for expensive operations
- Logger uses deferred logging: `logger.debug(() => [expensiveCalculation()])`

### 5. **Standalone Components**

- No traditional NgModule pattern; all components standalone with `imports: [...]`
- Configuration via `provide*()` functions in app config

### 6. **Custom Utilities**

- Check `src/core/utils/` for cross-cutting utilities (compare-by, math, traverse)
- Utilities exported from barrel `index.ts` files for clean imports

## Important Setup & Environment Notes

### Critical Gotchas

1. **Zoneless CD**: Requires proper signal/computed usage — avoid raw zone tasks
2. **Asset Loading**: Three.js DRACO decoder (WASM+JS) needs explicit webpack glob config
3. **piexif-ts**: CommonJS fork (ESM incompatible) — already whitelisted in `angular.json`
4. **i18n Dynamic Imports**: Locale files must be imported dynamically for code splitting (see `src/app/i18n/`)
5. **View Transitions**: Requires `view-transition-name` CSS rule per component — check `src/assets/styles/view-transition.css`

### Build Configuration

- **TypeScript**: `ES2022` target, strict mode enabled, skipTests by default
- **Dev Server**: Auto-opens on `http://localhost:5000`
- **Path aliases**: Configured in `tsconfig.app.json`
- **Bundle budgets** (production): 500kB warning / 1MB error for initial bundle

### Deployment

- See [devops/ENV-CONFIG-HOW-TO.md](devops/ENV-CONFIG-HOW-TO.md) for environment configuration
- Docker setup available in [devops/Dockerfile](devops/Dockerfile)

## Common Patterns by Feature

### Working with Signals

When modifying reactive state, ensure computed() dependencies are properly tracked:

```typescript
// Good: computed automatically depends on signals it accesses
readonly filtered = computed(() => this.items().filter(...));

// Use toSignal() for observable-to-signal conversion
readonly data = toSignal(this.data$, { initialValue: [] });
```

### Creating Upload Operators

Upload operators follow a consistent pattern:

```typescript
export function myOperator(config, logger, abort$) {
  return source =>
    source
      .pipe
      // your RxJS operators
      ();
}
```

### Adding New Features

1. Create feature folder in `src/app/` (e.g., `my-feature/`)
2. Create feature component with standalone: true
3. Add route in `src/app/app.routes.ts`
4. Use `@core/*` aliases for shared utilities
5. Follow existing naming: `entity.type.ts` for type definitions

## Skill Reference

For Angular best practices, consult [`.agents/skills/angular-developer/SKILL.md`](.agents/skills/angular-developer/SKILL.md):

- Components, inputs, outputs, host bindings
- Signals, linkedSignal, resource patterns
- Forms (prefer signal-based in Angular 21+)
- Dependency injection fundamentals
- Routing and guards
- Animations and styling (Tailwind CSS integration)
- Testing patterns

## Testing Strategy

This project uses **Vitest** with Angular testing utilities for fast, ESM-first test execution aligned with Angular 21's modern patterns.

### Running Tests

```bash
npm test          # Watch mode
```

### Testing Patterns

**Signal-based State**

```typescript
import { signal, computed } from '@angular/core';
import { describe, it, expect } from 'vitest';

describe('Signal Logic', () => {
  it('should compute derived state', () => {
    const count = signal(0);
    const doubled = computed(() => count() * 2);

    expect(doubled()).toBe(0);
    count.set(5);
    expect(doubled()).toBe(10);
  });
});
```

**Standalone Components with Zoneless CD**

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [provideZonelessChangeDetection()]
  }).compileComponents();
});
```

**Testing Upload Operators**

```typescript
import { toArray } from 'rxjs/operators';

describe('upload operator', () => {
  it('should process files through pipeline', async () => {
    const result = await from([file])
      .pipe(myOperator(config, logger, new Subject()), toArray())
      .toPromise();

    expect(result).toHaveLength(1);
  });
});
```

### Best Practices

1. **Use `toSignal()` for observables** in tests when converting RxJS streams to signals
2. **Mock injection tokens** (UPLOAD_PIPELINE, LOGGER) with `TestBed.inject()`
3. **Always provide `provideZonelessChangeDetection()`** in test setup
4. **Test computed() dependencies** by calling signal setters and verifying updates
5. **Use @testing-library/angular** for DOM queries in component tests (when component testing is fully configured)
6. **Start with utility function testing** - these work reliably with current setup
7. **Component testing** - Angular 21 standalone components may need additional configuration (work in progress)

## Quick Reference: Key Files

| File                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `src/main.ts`              | Bootstrap entry with all providers                        |
| `src/app/app.ts`           | Root component with view transitions                      |
| `src/app/app.routes.ts`    | Route definitions with lazy-loaded i18n                   |
| `src/core/angular/logger/` | Centralized logging with deferred evaluation              |
| `src/core/upload/`         | Upload pipeline architecture and operators                |
| `src/core/utils/`          | Shared utility functions (math, crypto, date, file, lazy) |
| `angular.json`             | Build config, dev server port, schematics defaults        |
| `tsconfig.app.json`        | Path aliases and compilation settings                     |
