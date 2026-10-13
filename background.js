/**
 * BlogCutter - Universal AI Prompt Saver Pro
 * Background Service Worker (Manifest V3)
 * Handles context menus, side panel triggers, storage updates & API sync
 */

const DEFAULT_API_BASE = 'https://blogcutter.com/api';

// On extension install or update: create context menu & init defaults
chrome.runtime.onInstalled.addListener(async (details) => {
  // Create context menu for right-click text selection
  chrome.contextMenus.create({
    id: 'blogcutter_save_selection',
    title: '💾 Save selection to BlogCutter Prompts',
    contexts: ['selection']
  });

  // Check and migrate legacy settings (e.g. blogcutter.ai -> blogcutter.com)
  const data = await chrome.storage.local.get(['api_config', 'prompts']);
  let apiConfig = data.api_config || {};

  if (!apiConfig.baseUrl || apiConfig.baseUrl.includes('blogcutter.ai')) {
    apiConfig.baseUrl = DEFAULT_API_BASE;
    apiConfig.urlPreset = 'live';
    await chrome.storage.local.set({ api_config: apiConfig });
  }

  // Update badge with current prompt count
  const prompts = data.prompts || [];
  updateBadgeCount(prompts.length);
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'blogcutter_save_selection' && info.selectionText) {
    const rawText = info.selectionText.trim();
    if (!rawText) return;

    // Generate smart title from first sentence or first 40 chars
    const firstLine = rawText.split('\n')[0].trim();
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;

    const newPrompt = {
      id: Date.now(),
      server_id: null,
      title: title || 'Saved Selection',
      content: rawText,
      category: 'General',
      is_favorite: false,
      use_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };

    // Store in chrome.storage.local
    const { prompts = [], api_config: apiConfig = {} } = await chrome.storage.local.get(['prompts', 'api_config']);
    prompts.unshift(newPrompt);
    await chrome.storage.local.set({ prompts });

    updateBadgeCount(prompts.length);

    // If connected to BlogCutter, sync to live database
    if (apiConfig.isVerified && apiConfig.userId) {
      try {
        const baseUrl = (apiConfig.baseUrl || DEFAULT_API_BASE).replace(/\/+$/, '');
        const res = await callApi(`${baseUrl}/prompt-saver/save`, 'POST', {
          user_id: Number(apiConfig.userId),
          title: newPrompt.title,
          content: newPrompt.content
        }, `${baseUrl}/prompts/save`);

        if (res && res.status === 'success' && res.prompt) {
          newPrompt.server_id = res.prompt.id;
          newPrompt.synced = true;
          await chrome.storage.local.set({ prompts });
        }
      } catch (err) {
        console.warn('Background sync failed:', err);
      }
    }

    // Flash feedback badge
    await flashBadge('SAVED', '#10b981', prompts.length);

    // Send toast notification to the active tab if possible
    if (tab && tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'SHOW_TOAST',
          message: `Saved to BlogCutter: "${title}"`,
          type: 'success'
        });
      } catch (e) {
        // Tab might not have content script loaded (e.g. chrome://)
      }
    }
  }
});

// Listen for runtime messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_SIDE_PANEL') {
    (async () => {
      try {
        const windowId = sender.tab ? sender.tab.windowId : (await chrome.windows.getLastFocused()).id;
        await chrome.sidePanel.open({ windowId });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async response
  }

  if (message.action === 'UPDATE_BADGE') {
    updateBadgeCount(message.count || 0);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'GET_PROMPTS_FOR_CONTENT') {
    (async () => {
      const { prompts = [] } = await chrome.storage.local.get('prompts');
      sendResponse({ prompts });
    })();
    return true;
  }
});

// Update badge count
async function updateBadgeCount(count) {
  try {
    const text = count > 0 ? String(count) : '';
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#38bdf8' });
  } catch (e) {
    // ignore
  }
}

// Flash badge text temporarily
async function flashBadge(text, color, originalCount) {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(async () => {
      updateBadgeCount(originalCount);
    }, 2000);
  } catch (e) {
    // ignore
  }
}

// Helper API Caller with dual-prefix fallback
async function callApi(primaryUrl, method = 'POST', body = null, fallbackUrl = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  async function attempt(url) {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const raw = await response.text();
    return { status: 'error', message: `HTTP ${response.status}: ${raw.substring(0, 100)}` };
  }

  try {
    const res = await attempt(primaryUrl);
    if (res && res.status !== 'error') return res;
    if (fallbackUrl) return await attempt(fallbackUrl);
    return res;
  } catch (err) {
    if (fallbackUrl) {
      return await attempt(fallbackUrl);
    }
    throw err;
  }
}
