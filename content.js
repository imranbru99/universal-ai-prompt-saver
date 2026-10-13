/**
 * BlogCutter - Universal AI Prompt Saver Pro
 * Content Script for ChatGPT, Claude, Gemini, DeepSeek, Perplexity & any AI
 */

(() => {
  // Identify active platform
  function getPlatformInfo() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('chatgpt.com') || host.includes('openai.com')) {
      return { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f' };
    }
    if (host.includes('claude.ai')) {
      return { id: 'claude', name: 'Claude', color: '#d97706' };
    }
    if (host.includes('gemini.google.com')) {
      return { id: 'gemini', name: 'Gemini', color: '#3b82f6' };
    }
    if (host.includes('deepseek.com')) {
      return { id: 'deepseek', name: 'DeepSeek', color: '#0ea5e9' };
    }
    if (host.includes('perplexity.ai')) {
      return { id: 'perplexity', name: 'Perplexity', color: '#22c55e' };
    }
    if (host.includes('poe.com')) {
      return { id: 'poe', name: 'Poe', color: '#8b5cf6' };
    }
    if (host.includes('copilot.microsoft.com') || host.includes('bing.com')) {
      return { id: 'copilot', name: 'Copilot', color: '#0284c7' };
    }
    if (host.includes('grok.com') || (host.includes('x.com') && window.location.pathname.includes('grok'))) {
      return { id: 'grok', name: 'Grok', color: '#f59e0b' };
    }
    if (host.includes('mistral.ai')) {
      return { id: 'mistral', name: 'Mistral', color: '#ea580c' };
    }
    return { id: 'generic', name: 'AI Web Editor', color: '#38bdf8' };
  }

  // Find the primary prompt input element on the page
  function findPromptInput() {
    const platform = getPlatformInfo().id;

    // 1. Platform-specific high priority selectors
    if (platform === 'chatgpt') {
      const el = document.querySelector('#prompt-textarea') ||
                 document.querySelector('div[contenteditable="true"]#prompt-textarea') ||
                 document.querySelector('textarea[data-id="root"]');
      if (el) return el;
    }

    if (platform === 'claude') {
      const el = document.querySelector('div[contenteditable="true"].ProseMirror') ||
                 document.querySelector('div[contenteditable="true"][data-placeholder]') ||
                 document.querySelector('div[contenteditable="true"]');
      if (el) return el;
    }

    if (platform === 'gemini') {
      const el = document.querySelector('rich-textarea div[contenteditable="true"]') ||
                 document.querySelector('div.ql-editor[contenteditable="true"]') ||
                 document.querySelector('div[contenteditable="true"]');
      if (el) return el;
    }

    if (platform === 'deepseek') {
      const el = document.querySelector('textarea#chat-input') ||
                 document.querySelector('textarea[placeholder*="DeepSeek"]') ||
                 document.querySelector('textarea');
      if (el) return el;
    }

    if (platform === 'perplexity') {
      const el = document.querySelector('textarea[placeholder*="Ask"]') ||
                 document.querySelector('textarea[placeholder*="Search"]') ||
                 document.querySelector('div[contenteditable="true"]');
      if (el) return el;
    }

    // 2. Active element if already focused
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable || active.tagName === 'INPUT')) {
      return active;
    }

    // 3. Fallback: Search visible candidate elements
    const candidates = [
      ...document.querySelectorAll('div[contenteditable="true"]'),
      ...document.querySelectorAll('textarea'),
      ...document.querySelectorAll('rich-textarea')
    ];

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 20 && window.getComputedStyle(el).display !== 'none') {
        if (el.tagName === 'RICH-TEXTAREA') {
          const inner = el.querySelector('div[contenteditable="true"]');
          if (inner) return inner;
        }
        return el;
      }
    }

    return null;
  }

  // Insert prompt text into the detected input field
  function insertText(text) {
    const input = findPromptInput();
    if (!input) {
      return { success: false, error: 'Could not locate prompt input on this page.' };
    }

    input.focus();

    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      // Use React-friendly property descriptor setter
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(input, text);
      } else {
        input.value = text;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    } else if (input.isContentEditable) {
      // For ProseMirror (Claude/ChatGPT), Quill (Gemini), Lexical:
      // Focus and select all
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      selection.removeAllRanges();
      selection.addRange(range);

      // Execute insertText
      const success = document.execCommand('insertText', false, text);
      if (!success) {
        // Fallback to textContent + synthetic events
        input.innerText = text;
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return { success: true, platform: getPlatformInfo().name };
  }

  // Capture current draft text typed into the AI input
  function captureDraft() {
    const input = findPromptInput();
    if (!input) {
      return { text: '', platform: getPlatformInfo().name };
    }

    let text = '';
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      text = input.value || '';
    } else if (input.isContentEditable) {
      text = input.innerText || input.textContent || '';
    }

    return { text: text.trim(), platform: getPlatformInfo().name };
  }

  // In-Page Toast Display
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.bc-inpage-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `bc-inpage-toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚡';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  // --- Floating Quick Prompt Picker Widget ---
  let floatingBtn = null;
  let quickPicker = null;

  async function createFloatingWidget() {
    // Check if user disabled floating launcher in settings
    const { settings = {} } = await chrome.storage.local.get('settings');
    if (settings.hideFloatingWidget) return;

    if (document.getElementById('blogcutter-floating-btn')) return;

    // Floating Launch Button
    floatingBtn = document.createElement('div');
    floatingBtn.id = 'blogcutter-floating-btn';
    floatingBtn.title = `BlogCutter Prompt Saver (Alt+P)`;
    floatingBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="m9 15 2 2 4-4"></path>
      </svg>
    `;

    // Floating Modal
    quickPicker = document.createElement('div');
    quickPicker.id = 'blogcutter-quick-picker';
    quickPicker.className = 'hidden';

    const info = getPlatformInfo();
    quickPicker.innerHTML = `
      <div class="bc-picker-header">
        <div class="bc-picker-brand">
          <span>BlogCutter</span>
          <span class="bc-ai-badge">${info.name}</span>
        </div>
        <button class="bc-picker-close" id="bc-picker-close-btn">&times;</button>
      </div>
      <div class="bc-picker-search-wrap">
        <input type="text" class="bc-picker-search-input" id="bc-picker-search" placeholder="Search saved prompts... (Alt+P)">
      </div>
      <div class="bc-picker-list" id="bc-picker-list">
        <div style="padding: 16px; text-align: center; color: #94a3b8;">Loading prompts...</div>
      </div>
      <div class="bc-picker-footer">
        <button class="bc-capture-btn" id="bc-picker-capture-btn">📥 Save Draft</button>
        <span>Click prompt to insert</span>
      </div>
    `;

    document.body.appendChild(floatingBtn);
    document.body.appendChild(quickPicker);

    // Event Listeners
    floatingBtn.addEventListener('click', toggleQuickPicker);

    quickPicker.querySelector('#bc-picker-close-btn').addEventListener('click', () => {
      quickPicker.classList.add('hidden');
    });

    const searchInput = quickPicker.querySelector('#bc-picker-search');
    searchInput.addEventListener('input', () => {
      renderQuickPickerList(searchInput.value.trim());
    });

    quickPicker.querySelector('#bc-picker-capture-btn').addEventListener('click', async () => {
      const { text } = captureDraft();
      if (!text) {
        showToast('No prompt draft typed in the chat input.', 'error');
        return;
      }
      const title = text.split('\n')[0].substring(0, 40);
      const newPrompt = {
        id: Date.now(),
        server_id: null,
        title: title || 'Captured Prompt',
        content: text,
        category: 'General',
        is_favorite: false,
        use_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      };

      const { prompts = [] } = await chrome.storage.local.get('prompts');
      prompts.unshift(newPrompt);
      await chrome.storage.local.set({ prompts });

      showToast(`Saved draft: "${title}"`, 'success');
      renderQuickPickerList();
    });
  }

  async function toggleQuickPicker() {
    if (!quickPicker) return;
    const isHidden = quickPicker.classList.contains('hidden');
    if (isHidden) {
      quickPicker.classList.remove('hidden');
      await renderQuickPickerList();
      const search = quickPicker.querySelector('#bc-picker-search');
      if (search) search.focus();
    } else {
      quickPicker.classList.add('hidden');
    }
  }

  async function renderQuickPickerList(query = '') {
    const listEl = quickPicker.querySelector('#bc-picker-list');
    if (!listEl) return;

    const { prompts = [] } = await chrome.storage.local.get('prompts');
    const q = query.toLowerCase();
    const filtered = prompts.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.content && p.content.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #94a3b8;">
          ${query ? 'No matching prompts found.' : 'No prompts saved yet.'}
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    filtered.slice(0, 30).forEach(p => {
      const item = document.createElement('div');
      item.className = 'bc-picker-item';
      item.innerHTML = `
        <div class="bc-item-top">
          <span>${escapeHtml(p.title)}</span>
          ${p.is_favorite ? '<span>⭐</span>' : ''}
        </div>
        <div class="bc-item-preview">${escapeHtml(p.content)}</div>
      `;

      item.addEventListener('click', async () => {
        const res = insertText(p.content);
        if (res.success) {
          showToast(`Inserted into ${res.platform}!`, 'success');
          quickPicker.classList.add('hidden');

          // Increment usage count
          p.use_count = (p.use_count || 0) + 1;
          await chrome.storage.local.set({ prompts });
        } else {
          showToast(res.error, 'error');
        }
      });

      listEl.appendChild(item);
    });
  }

  // Keyboard shortcut: Alt+P toggles quick picker
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      toggleQuickPicker();
    }
  });

  // Message listener from popup / background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'INSERT_PROMPT') {
      const result = insertText(message.text);
      if (result.success) {
        showToast(`Inserted into ${result.platform}!`, 'success');
      }
      sendResponse(result);
      return true;
    }

    if (message.action === 'CAPTURE_DRAFT') {
      const data = captureDraft();
      sendResponse(data);
      return true;
    }

    if (message.action === 'GET_AI_INFO') {
      const info = getPlatformInfo();
      sendResponse(info);
      return true;
    }

    if (message.action === 'SHOW_TOAST') {
      showToast(message.message, message.type || 'info');
      sendResponse({ success: true });
      return true;
    }
  });

  // Initialize floating widget
  createFloatingWidget();
})();
