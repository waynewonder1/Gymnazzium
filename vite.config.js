import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Writes /asset-list.json: every file of this build in /assets/. The service worker uses it to
// keep the current build's page chunks in its offline cache (and only drop older builds' files).
const assetList = () => ({
  name: 'asset-list',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter((f) => f.startsWith('assets/')).map((f) => `/${f}`);
    this.emitFile({ type: 'asset', fileName: 'asset-list.json', source: JSON.stringify(files) });
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), assetList()],
})
