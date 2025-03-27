import { sampleFunction } from '@src/sampleFunction';

console.log('content script loaded');

// Shows how to call a function defined in another module
sampleFunction();

// Listen for DOM changes to detect new listings
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      checkForListings();
    }
  });
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Check for listings on the page
function checkForListings() {
  const url = window.location.href;

  if (url.includes('ebay.com')) {
    handleEbayPage();
  } else if (url.includes('facebook.com/marketplace')) {
    handleFacebookPage();
  } else if (url.includes('vinted.com')) {
    handleVintedPage();
  }
}

// Handle eBay pages
function handleEbayPage() {
  // Find listing elements
  const listingTitle = document.querySelector('#itemTitle');
  const price = document.querySelector('#prcIsum');
  const seller = document.querySelector('#mbgLink');

  if (listingTitle || price || seller) {
    requestScan();
  }
}

// Handle Facebook Marketplace pages
function handleFacebookPage() {
  // Find listing elements (adjust selectors as needed)
  const listingElements = document.querySelectorAll('[data-testid="marketplace_listing_title"]');

  if (listingElements.length > 0) {
    requestScan();
  }
}

// Handle Vinted pages
function handleVintedPage() {
  // Find listing elements (adjust selectors as needed)
  const listingElements = document.querySelectorAll('.ItemBox_overlay__1k1kt');

  if (listingElements.length > 0) {
    requestScan();
  }
}

// Request a scan from the background script
async function requestScan() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_PAGE',
    });

    if (response.analysis) {
      injectUI(response.analysis);
    }
  } catch (error) {
    console.error('Failed to request scan:', error);
  }
}

// Inject UI elements
function injectUI(analysis: any) {
  // Create warning banner if high risk
  if (analysis.risk === 'High') {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #F44336;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    banner.textContent = '⚠️ Warning: This listing shows multiple high-risk signals';
    document.body.prepend(banner);
  }

  // Add risk indicators next to price
  const priceElements = [
    ...Array.from(document.querySelectorAll('#prcIsum')), // eBay
    ...Array.from(document.querySelectorAll('[data-testid="marketplace_listing_price"]')), // Facebook
    ...Array.from(document.querySelectorAll('.ItemBox_price__2Kj3C')), // Vinted
  ];

  priceElements.forEach(element => {
    if (element) {
      const badge = document.createElement('span');
      badge.style.cssText = `
        margin-left: 8px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        background: ${analysis.risk === 'Low' ? '#4CAF50' : analysis.risk === 'Medium' ? '#FF9800' : '#F44336'};
        color: white;
      `;
      badge.textContent = `${analysis.risk} Risk`;
      element.parentElement?.appendChild(badge);
    }
  });
}

// Initial check
checkForListings();
