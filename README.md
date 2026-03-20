# GLB X-Ray

A static web app for inspecting the internal structure of GLB (glTF Binary) files.

> This project was created with the help of [Claude](https://claude.ai) (Anthropic).

## Features

- **Drag-and-drop or click-to-open** any `.glb` file — runs entirely in the browser, no upload
- **JSON chunk explorer** — collapsible tree with type-colored values and inline collection summaries
- **Live search** — filter the tree by key name or value
- **glTF enum labels** — numeric enum values decoded inline (e.g. `componentType: 5126 → "FLOAT"`)
- **Cross-reference navigation** — index fields link to their target nodes; each node shows back-references from elsewhere in the JSON
- **Data URI inspection** — buffer and image data URIs show decoded/encoded byte sizes; images open in a preview modal
- **File metadata** sidebar showing total size, GLB version, and all chunks with their sizes
- **Dark / light theme** following system preference

## Dev

```sh
npm install
npm run dev       # dev server at localhost:5173
npm test          # run all tests once
npm run test:watch # run tests in watch mode
npm run lint      # ESLint
npm run build     # production build → dist/
```

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- CSS Modules
