import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import { ScamAnalysis } from '../../../pages/popup/src/services/scamDetection';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

// Store analysis results in memory
const analysisCache = new Map<string, ScamAnalysis>();

// Listen for commands
chrome.commands.onCommand.addListener(command => {
  if (command === 'scan-listing') {
    scanCurrentTab();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    handleScanRequest(sender.tab?.id, sendResponse);
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'GET_ANALYSIS') {
    const tabId = sender.tab?.id;
    if (tabId && analysisCache.has(String(tabId))) {
      sendResponse({ analysis: analysisCache.get(String(tabId)) });
    } else {
      sendResponse({ analysis: null });
    }
    return true;
  }
});

// Scan the current tab
async function scanCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await handleScanRequest(tab.id);
  }
}

// Handle scan requests
async function handleScanRequest(tabId?: number, sendResponse?: (response: any) => void) {
  if (!tabId) return;

  try {
    // Execute content script to get page data
    const [{ result: pageData }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // This runs in the context of the page
        return {
          url: window.location.href,
          title: document.title,
          // Add more data extraction logic here
        };
      },
    });

    // Mock analysis for now
    const analysis: ScamAnalysis = {
      risk: 'Medium',
      redFlags: [
        {
          type: 'price',
          description: 'Price is significantly below market average',
          severity: 'high',
        },
      ],
      confidence: 0.85,
    };

    // Cache the results
    analysisCache.set(String(tabId), analysis);

    // Send response if callback exists
    if (sendResponse) {
      sendResponse({ analysis });
    }

    // Update extension badge
    await updateBadge(tabId, analysis.risk);
  } catch (error) {
    console.error('Scan failed:', error);
    if (sendResponse) {
      sendResponse({ error: 'Scan failed' });
    }
  }
}

// Update the extension badge based on risk level
async function updateBadge(tabId: number, risk: string) {
  const colors = {
    Low: '#4CAF50',
    Medium: '#FF9800',
    High: '#F44336',
  };

  await chrome.action.setBadgeText({
    tabId,
    text: risk[0], // First letter of risk level
  });

  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: colors[risk as keyof typeof colors],
  });
}
