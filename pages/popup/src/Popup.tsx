import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';
import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

// Types
type ScamRisk = 'Low' | 'Medium' | 'High';
type PopupState = 'default' | 'scanning' | 'listing' | 'limit' | 'message' | 'feedback';

interface RedFlag {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>('default');
  const [scamRisk, setScamRisk] = useState<ScamRisk>('Low');
  const [credits, setCredits] = useState(14);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  // Styles
  const buttonBase = 'px-6 py-3 rounded-xl text-lg font-medium transition-all duration-200';
  const primaryButton = twMerge(buttonBase, 'bg-black text-white hover:bg-gray-800');
  const secondaryButton = twMerge(buttonBase, 'bg-gray-100 text-black hover:bg-gray-200');

  const RiskBadge: React.FC<{ risk: ScamRisk }> = ({ risk }) => {
    const colors = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800',
    };

    return <span className={`${colors[risk]} px-5 py-2 rounded-full text-base font-medium`}>{risk} Risk</span>;
  };

  const DefaultState = () => (
    <div className="p-10 space-y-6">
      <h2 className="text-3xl font-bold">Monty is ready.</h2>
      <p className="text-gray-600 text-xl">Go to eBay, Facebook Marketplace, or Vinted to start detecting scams.</p>
      <button className={secondaryButton}>View supported platforms</button>
    </div>
  );

  const LoadingState = () => (
    <div className="p-10 flex flex-col items-center justify-center space-y-6">
      <div className="animate-pulse flex space-x-2">
        <div className="w-3 h-3 bg-black rounded-full"></div>
        <div className="w-3 h-3 bg-black rounded-full"></div>
        <div className="w-3 h-3 bg-black rounded-full"></div>
      </div>
      <p className="text-gray-600 text-xl">Scanning this listing...</p>
    </div>
  );

  const ListingState = () => (
    <div className="p-10 space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold truncate flex-1">iPhone 14 Pro - Like New</h2>
        <RiskBadge risk={scamRisk} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-medium">Red Flags:</h3>
        <ul className="space-y-3">
          {redFlags.map((flag, i) => (
            <li key={i} className="flex items-start space-x-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <span className="text-base text-gray-700">{flag.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Ask Monty: Is this listing safe?"
          className="w-full px-6 py-3 text-lg rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        {aiResponse && <p className="text-base text-gray-700 bg-gray-50 p-5 rounded-xl">{aiResponse}</p>}
      </div>

      <div className="flex justify-center space-x-4">
        <button className="text-4xl hover:scale-110 transition-transform">👍</button>
        <button className="text-4xl hover:scale-110 transition-transform">👎</button>
      </div>
    </div>
  );

  const LimitState = () => (
    <div className="p-10 space-y-6">
      <h2 className="text-3xl font-bold">Scan limit reached</h2>
      <p className="text-gray-600 text-xl">You've used all your scam scans for this month.</p>
      <button className={primaryButton}>Upgrade for more credits</button>
    </div>
  );

  const MessageState = () => (
    <div className="p-10 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Buyer Profile</h2>
        <RiskBadge risk={scamRisk} />
      </div>
      <div className="bg-gray-50 p-6 rounded-xl space-y-3">
        <p className="text-base text-gray-700">⚠️ Warning: This buyer has shown suspicious activity patterns</p>
        <p className="text-base text-gray-600">• History of refund abuse • Multiple accounts detected</p>
      </div>
    </div>
  );

  // Credits display - always visible
  const CreditsDisplay = () => (
    <div className="absolute top-4 right-4 text-base">
      <span className="font-medium">{credits}</span> credits left
    </div>
  );

  return (
    <div className="w-[960px] min-h-[800px] relative bg-white font-['Azaret_Mono']">
      <CreditsDisplay />
      {state === 'default' && <DefaultState />}
      {state === 'scanning' && <LoadingState />}
      {state === 'listing' && <ListingState />}
      {state === 'limit' && <LimitState />}
      {state === 'message' && <MessageState />}
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
