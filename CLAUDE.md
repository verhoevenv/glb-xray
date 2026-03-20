# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev        # dev server at localhost:5173
npm test           # run all tests once (vitest run)
npm run test:watch # run tests in watch mode
npm run build      # type-check + production build → dist/
npm run lint       # ESLint
npx tsc --noEmit   # type-check only
```

Run a single test file:
```sh
npx vitest run src/lib/glbParser.test.ts
```

## Architecture

This is a fully static, browser-only app — no backend, no uploads. The GLB file is parsed locally using the File API.

**Data flow:**
1. `Dropzone` → user picks/drops a `.glb` file
2. `App` reads it as `ArrayBuffer` and calls `parseFile()` from `glbParser.ts`
3. `App` holds the `ParseResult` in state and renders `GlbInfo` (sidebar) + `JsonTree` (main panel)
4. `JsonTree` builds a `BackRefMap` (via `gltfRefs.ts`) and provides `NavigationContext` + `ImageContext` to the tree
5. `TreeNode` renders recursively; leaf nodes show enum labels, ref links, and data URI info

**Key lib modules:**
- `glbParser.ts` — binary GLB parser: validates header, extracts JSON and BIN chunks, returns `ParseResult`
- `jsonSearch.ts` — `getMatchingPaths` searches keys; `valueMatchesSearch` searches values (these are separate — key search does NOT call `valueMatchesSearch`)
- `gltfRefs.ts` — forward ref resolution (`getRefTarget`) and back-ref map builder (`buildBackRefMap`); understands direct index fields, array-of-indices fields, and object-value fields
- `gltfEnums.ts` — maps numeric glTF enum values to their string names (e.g. `componentType: 5126 → "FLOAT"`)
- `dataUri.ts` — data URI helpers: detect, decode, measure byte sizes

**Context providers (set up in `JsonTree`):**
- `NavigationContext` — tracks the currently targeted path (`navigatePath`), exposes `navigateTo()` and `getBackRefs()`, and the set of root-level JSON keys used to validate ref links
- `ImageContext` — provides `binChunk` (raw BIN chunk bytes), `glbJson`, and `extraBuffers` (for multi-buffer GLBs) to enable image preview in `TreeNode`

## Key behaviors and gotchas

- `vite.config.ts` must import `defineConfig` from `'vitest/config'`, not `'vite'`, to type the `test` key
- `@testing-library/react` normalizes whitespace in `getByText`, so leading spaces are stripped; use `/\{2\}/` not `/ \{2\}/` in regex matchers
- `valueMatchesSearch` only searches values — key search is handled separately in `getMatchingPaths`
- Do NOT add "Co-Authored-By: Claude" footers to commits — Claude is credited in the README
