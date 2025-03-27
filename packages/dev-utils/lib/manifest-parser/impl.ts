import type { Manifest, ManifestParserInterface } from './types.js';

export const ManifestParserImpl: ManifestParserInterface = {
  convertManifestToString: (manifest, isFirefox) => {
    if (isFirefox) {
      manifest = convertToFirefoxCompatibleManifest(manifest);
    }

    // Remove localization if default_locale is not present
    const manifestCopy = { ...manifest };
    if (!manifestCopy.default_locale) {
      delete manifestCopy.default_locale;
      if (manifestCopy.name?.startsWith('__MSG_')) {
        manifestCopy.name = manifestCopy.name.replace(/__MSG_(\w+)__/g, (substring: string) => {
          const key = substring.replace(/__MSG_|__/g, '');
          return key === 'appName' ? 'Monty Agent' : manifestCopy.name || '';
        });
      }
      if (manifestCopy.description?.startsWith('__MSG_')) {
        manifestCopy.description = manifestCopy.description.replace(/__MSG_(\w+)__/g, (substring: string) => {
          const key = substring.replace(/__MSG_|__/g, '');
          return key === 'appDescription'
            ? 'AI-powered scam detection for online marketplaces'
            : manifestCopy.description || '';
        });
      }
    }

    return JSON.stringify(manifestCopy, null, 2);
  },
};

const convertToFirefoxCompatibleManifest = (manifest: Manifest) => {
  const manifestCopy = {
    ...manifest,
  } as { [key: string]: unknown };

  if (manifest.background?.service_worker) {
    manifestCopy.background = {
      scripts: [manifest.background.service_worker],
      type: 'module',
    };
  }
  if (manifest.options_page) {
    manifestCopy.options_ui = {
      page: manifest.options_page,
      browser_style: false,
    };
  }
  manifestCopy.content_security_policy = {
    extension_pages: "script-src 'self'; object-src 'self'",
  };
  manifestCopy.permissions = (manifestCopy.permissions as string[]).filter(value => value !== 'sidePanel');

  delete manifestCopy.options_page;
  delete manifestCopy.side_panel;
  return manifestCopy as Manifest;
};
