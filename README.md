# Awkwords

Awkwords is an online application that randomly generates words from a given pattern. Awkwords was created by [Petr Mejzlík](https://github.com/petmir) sometime in the late 2000s, and version 1.2 was released in 2010.

## Version 1.3

<img src="./public/favicon-old.ico" width="16px" alt="Old favicon" /> Versions 1.0, 1.1, and 1.2 were built using PHP. It required a PHP server running to serve the webpage and handle the word generation. All calculations were done server-side, so there was always a lag while your browser communicated with the server and then the server communicated back.

<img src="./public/favicon.ico" width="16px" alt="New favicon" /> Version 1.3.0 is completely rebuilt from scratch using Vue 3 and Vite. This allows the app to work without PHP, or truly without any back-end server at all. All word generation is handled within your browser, so it runs blazingly fast and works offline. It also works just as well on your phone. For a full list of changes, see the [changelog](./CHANGELOG.md).

## Getting Started

```bash
npm install
npm run dev        # development server
npm test           # Vitest unit tests
npm run build      # typecheck + production build in dist/
npm run preview    # serve the production build
```

`dist/` is a static site with relative paths, so it can be hosted from any folder or static host.
