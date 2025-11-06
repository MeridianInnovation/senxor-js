import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: "browser",
  exports: {
    devExports: true,
  },
});
