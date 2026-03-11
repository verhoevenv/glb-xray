# GLB X-Ray

A static web app for inspecting the internal structure of GLB (glTF Binary) files.

> This project was created with the help of [Claude](https://claude.ai) (Anthropic).

## Features

- **Drag-and-drop or click-to-open** any `.glb` file — runs entirely in the browser, no upload
- **JSON chunk explorer** — collapsible tree with type-colored values and inline collection summaries
- **Live search** — filter the tree by key name or value
- **File metadata** sidebar showing total size, GLB version, and all chunks with their sizes
- **Dark / light theme** following system preference

## Dev

```sh
npm install
npm run dev       # dev server at localhost:5173
npm test          # run tests
npm run build     # production build → dist/
```

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- CSS Modules
