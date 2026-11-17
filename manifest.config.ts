import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Ghazely',
  version: '0.1.0',
  description: 'The longer you stare, the worse the page looks. A real rest heals it.',
  icons: {
    '16': 'public/icons/icon-16.png',
    '32': 'public/icons/icon-32.png',
    '48': 'public/icons/icon-48.png',
    '128': 'public/icons/icon-128.png',
  },
  action: {
    default_title: 'Ghazely',
    default_popup: 'src/popup/popup.html',
    default_icon: {
      '16': 'public/icons/icon-16.png',
      '32': 'public/icons/icon-32.png',
    },
  },
  options_ui: { page: 'src/options/options.html', open_in_tab: true },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
  // Each one is explained in the README.
  permissions: ['storage', 'idle', 'alarms', 'tabs'],
});
