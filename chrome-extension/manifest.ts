import type { Manifest } from '@extension/dev-utils/lib/manifest-parser/types';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const { version } = packageJson;

// Convert version to semver (e.g. 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version.replace(/[^\d.-]+/g, '').split(/[.-]/);

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest: Manifest = {
  name: 'Monty Agent',
  description: 'AI-powered scam detection for online marketplaces',
  version,
  version_name: version,
  manifest_version: 3,
  action: {
    default_popup: 'popup.html',
    default_icon: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
  permissions: ['activeTab', 'storage', 'scripting', 'tabs'],
  host_permissions: [
    'https://ebay.com/*',
    'https://*.ebay.com/*',
    'http://ebay.com/*',
    'http://*.ebay.com/*',
    'https://facebook.com/marketplace/*',
    'https://*.facebook.com/marketplace/*',
    'http://facebook.com/marketplace/*',
    'http://*.facebook.com/marketplace/*',
    'https://vinted.com/*',
    'https://*.vinted.com/*',
    'http://vinted.com/*',
    'http://*.vinted.com/*',
  ],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://ebay.com/*',
        'https://*.ebay.com/*',
        'http://ebay.com/*',
        'http://*.ebay.com/*',
        'https://facebook.com/marketplace/*',
        'https://*.facebook.com/marketplace/*',
        'http://facebook.com/marketplace/*',
        'http://*.facebook.com/marketplace/*',
        'https://vinted.com/*',
        'https://*.vinted.com/*',
        'http://vinted.com/*',
        'http://*.vinted.com/*',
      ],
      js: ['content/index.iife.js'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['content-ui/*'],
      matches: [
        'https://ebay.com/*',
        'https://*.ebay.com/*',
        'http://ebay.com/*',
        'http://*.ebay.com/*',
        'https://facebook.com/marketplace/*',
        'https://*.facebook.com/marketplace/*',
        'http://facebook.com/marketplace/*',
        'http://*.facebook.com/marketplace/*',
        'https://vinted.com/*',
        'https://*.vinted.com/*',
        'http://vinted.com/*',
        'http://*.vinted.com/*',
      ],
    },
  ],
  commands: {
    'scan-listing': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S',
      },
      description: 'Scan current listing for scams',
    },
  },
} satisfies Manifest;

export default manifest;
