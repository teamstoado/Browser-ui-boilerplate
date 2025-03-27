import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import setRelatedLocaleImports from './set_related_locale_import.js';
import { IS_DEV } from '@extension/env';

(() => {
  const i18nPath = IS_DEV ? 'lib/i18n-dev.ts' : 'lib/i18n-prod.ts';
  cpSync(i18nPath, resolve('lib', 'i18n.ts'));

  const outDir = resolve(import.meta.dirname, '..', '..', '..', '..', 'dist');
  if (!existsSync(outDir)) {
    mkdirSync(outDir);
  }

  // Check if localization is enabled in manifest
  const manifestPath = resolve(import.meta.dirname, '..', '..', '..', '..', 'chrome-extension', 'manifest.ts');
  const manifestContent = readFileSync(manifestPath, 'utf8');
  const hasLocalization =
    manifestContent.includes('default_locale') ||
    manifestContent.includes('__MSG_') ||
    manifestContent.includes('chrome.i18n');

  // Only copy locales if localization is enabled
  if (hasLocalization) {
    const localePath = resolve(outDir, '_locales');
    cpSync(resolve('locales'), localePath, { recursive: true });
  }

  if (IS_DEV) {
    setRelatedLocaleImports();
  }
  console.log('I18n build complete');
})();
