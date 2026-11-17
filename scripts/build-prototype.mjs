// Builds the eye prototype into a plain script so the HTML page can load it without the extension build.
import { build } from 'vite';

await build({
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  build: {
    outDir: 'src/content/eye',
    emptyOutDir: false,
    minify: false,
    lib: { entry: 'src/content/eye/prototype.ts', formats: ['iife'], name: 'EyePrototype', fileName: () => 'prototype.js' },
  },
});
