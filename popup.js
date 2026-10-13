/**
 * BlogCutter - Universal AI Prompt Saver Pro
 * Popup & Side Panel UI Controller
 * Dual API endpoints: blogcutter.com/api/prompt-saver/* and blogcutter.com/api/prompts/*
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements - Header & Nav
  const navNewBtn = document.getElementById('nav-new-btn');
  const navCaptureBtn = document.getElementById('nav-capture-btn');
  const navSidepanelBtn = document.getElementById('nav-sidepanel-btn');
  const navImportBtn = document.getElementById('nav-import-btn');
  const navSettingsBtn = document.getElementById('nav-settings-btn');

  const aiDetectedPill = document.getElementById('ai-detected-pill');
  const aiPillDot = document.getElementById('ai-pill-dot');
  const aiDetectedName = document.getElementById('ai-detected-name');

  const connectionBadge = document.getElementById('connection-badge');
  const badgeText = document.getElementById('badge-text');
  const toastBanner = document.getElementById('toast-banner');

  // Panels
  const formPanel = document.getElementById('form-panel');
  const variablesPanel = document.getElementById('variables-panel');
  const settingsPanel = document.getElementById('settings-panel');
  const importPanel = document.getElementById('import-panel');

  const closeFormBtn = document.getElementById('close-form-btn');
  const cancelFormBtn = document.getElementById('cancel-form-btn');
  const closeVariablesBtn = document.getElementById('close-variables-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const closeImportBtn = document.getElementById('close-import-btn');

  // Form Elements
  const formTitle = document.getElementById('form-title');
  const editIdInput = document.getElementById('edit-id');
  const editServerIdInput = document.getElementById('edit-server-id');
  const titleInput = document.getElementById('prompt-title');
  const categorySelect = document.getElementById('prompt-category');
  const contentInput = document.getElementById('prompt-content');
  const savePromptBtn = document.getElementById('save-prompt-btn');

  // Variables Panel Elements
  const varTargetAi = document.getElementById('var-target-ai');
  const varInputsContainer = document.getElementById('variables-inputs-container');
  const varCompiledPreview = document.getElementById('var-compiled-preview');
  const insertCompiledBtn = document.getElementById('insert-compiled-btn');
  const copyCompiledBtn = document.getElementById('copy-compiled-btn');
  const insertRawBtn = document.getElementById('insert-raw-btn');

  // Settings & Verification Elements
  const unverifiedBox = document.getElementById('unverified-box');
  const verifiedBox = document.getElementById('verified-box');
  const apiEmailInput = document.getElementById('api-email-input');
  const sendCodeBtn = document.getElementById('send-code-btn');
  const changeEmailBtn = document.getElementById('change-email-btn');
  const verifyCodeRow = document.getElementById('verify-code-row');
  const apiCodeInput = document.getElementById('api-code-input');
  const verifyCodeBtn = document.getElementById('verify-code-btn');
  const codeHint = document.getElementById('code-hint');

  const verifiedUserEmail = document.getElementById('verified-user-email');
  const verifiedUserId = document.getElementById('verified-user-id');
  const syncNowBtn = document.getElementById('sync-now-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const prefFloatingWidget = document.getElementById('pref-floating-widget');

  // Import / Export Elements
  const importTextInput = document.getElementById('import-text');
  const importSyncLiveCheckbox = document.getElementById('import-sync-live');
  const executeImportBtn = document.getElementById('execute-import-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');

  // Search & Filter Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('sort-select');
  const filterChipsContainer = document.getElementById('filter-chips');
  const promptListContainer = document.getElementById('prompt-list');
  const promptsCounter = document.getElementById('prompts-counter');
  const footerSyncStatus = document.getElementById('footer-sync-status');

  // Presets & Constants
  const LIVE_URL = 'https://blogcutter.com/api';
  const LOCAL_URL = 'http://127.0.0.1:8000/api';

  // State
  let allPrompts = [];
  let apiConfig = {
    baseUrl: LIVE_URL,
    urlPreset: 'live',
    isVerified: false,
    email: '',
    userId: null,
    userName: ''
  };
  let userSettings = {
    hideFloatingWidget: false
  };
  let activeAi = {
    id: 'generic',
    name: 'Universal AI',
    color: '#38bdf8'
  };
  let currentActiveTab = null;
  let activeFilterCategory = 'all';
  let activePromptForVariables = null;

  // --- Initialize App ---
  await initApp();

  async function initApp() {
    // 1. Load stored data
    const data = await chrome.storage.local.get(['prompts', 'api_config', 'settings']);
    allPrompts = data.prompts || [];

    if (data.api_config) {
      apiConfig = { ...apiConfig, ...data.api_config };
      // Migrate legacy domain if present
      if (!apiConfig.baseUrl || apiConfig.baseUrl.includes('blogcutter.ai')) {
        apiConfig.baseUrl = LIVE_URL;
        apiConfig.urlPreset = 'live';
        await chrome.storage.local.set({ api_config: apiConfig });
      }
    }

    if (data.settings) {
      userSettings = { ...userSettings, ...data.settings };
    }
    prefFloatingWidget.checked = !userSettings.hideFloatingWidget;

    // 2. Detect Active AI Platform
    await detectCurrentTabAi();

    // 3. Render initial views
    renderApiSettings();
    updateConnectionStatusUI();
    renderPrompts();

    // 4. Update badge
    try {
      chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', count: allPrompts.length });
    } catch (e) {}
  }

  // Detect current active tab AI platform
  async function detectCurrentTabAi() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentActiveTab = tab;

      if (!tab || !tab.url) {
        setAiPill('Universal AI', '#38bdf8');
        return;
      }

      const url = tab.url.toLowerCase();
      if (url.includes('claude.ai')) {
        activeAi = { id: 'claude', name: 'Claude AI', color: '#d97706' };
      } else if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        activeAi = { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f' };
      } else if (url.includes('gemini.google.com')) {
        activeAi = { id: 'gemini', name: 'Google Gemini', color: '#3b82f6' };
      } else if (url.includes('deepseek.com')) {
        activeAi = { id: 'deepseek', name: 'DeepSeek AI', color: '#0ea5e9' };
      } else if (url.includes('perplexity.ai')) {
        activeAi = { id: 'perplexity', name: 'Perplexity', color: '#22c55e' };
      } else if (url.includes('poe.com')) {
        activeAi = { id: 'poe', name: 'Poe AI', color: '#8b5cf6' };
      } else if (url.includes('copilot.microsoft.com') || url.includes('bing.com/chat')) {
        activeAi = { id: 'copilot', name: 'MS Copilot', color: '#0284c7' };
      } else if (url.includes('grok.com') || url.includes('x.com/i/grok')) {
        activeAi = { id: 'grok', name: 'Grok (xAI)', color: '#f59e0b' };
      } else if (url.includes('mistral.ai')) {
        activeAi = { id: 'mistral', name: 'Mistral Le Chat', color: '#ea580c' };
      } else {
        activeAi = { id: 'generic', name: 'Universal AI', color: '#38bdf8' };
      }

      setAiPill(activeAi.name, activeAi.color);
    } catch (e) {
      setAiPill('Universal AI', '#38bdf8');
    }
  }

  function setAiPill(name, color) {
    aiDetectedName.textContent = name;
    aiPillDot.style.background = color;
    aiPillDot.style.boxShadow = `0 0 6px ${color}`;
    aiDetectedPill.style.borderColor = `${color}55`;
    aiDetectedPill.style.background = `${color}18`;
    aiDetectedPill.style.color = '#ffffff';
  }

  // --- Panels Navigation ---
  function hideAllPanels() {
    formPanel.classList.add('hidden');
    variablesPanel.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    importPanel.classList.add('hidden');
  }

  navNewBtn.addEventListener('click', () => {
    const isVisible = !formPanel.classList.contains('hidden') && !editIdInput.value;
    hideAllPanels();
    if (!isVisible) {
      resetPromptForm();
      formTitle.textContent = 'Create New Prompt';
      formPanel.classList.remove('hidden');
      titleInput.focus();
    }
  });

  navCaptureBtn.addEventListener('click', async () => {
    hideAllPanels();
    navCaptureBtn.classList.add('primary-nav-btn');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showToast('No active browser tab found.', 'error');
        return;
      }

      // Send capture message to tab
      let draftText = '';
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'CAPTURE_DRAFT' });
        if (response && response.text) {
          draftText = response.text;
        }
      } catch (e) {
        // Fallback: executeScript
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const el = document.querySelector('#prompt-textarea') ||
                       document.querySelector('div[contenteditable="true"]') ||
                       document.querySelector('textarea#chat-input') ||
                       document.querySelector('textarea');
            if (el) {
              return el.value || el.innerText || el.textContent || '';
            }
            return '';
          }
        });
        if (results && results[0] && results[0].result) {
          draftText = results[0].result.trim();
        }
      }

      if (!draftText) {
        showToast(`No prompt draft found in ${activeAi.name}. Type a prompt in the chat box first!`, 'info');
        return;
      }

      // Populate form with captured text
      resetPromptForm();
      const firstLine = draftText.split('\n')[0].trim();
      titleInput.value = firstLine.length > 40 ? firstLine.substring(0, 37) + '...' : firstLine;
      contentInput.value = draftText;
      formTitle.textContent = `Captured from ${activeAi.name}`;
      formPanel.classList.remove('hidden');
      titleInput.focus();
      showToast(`Captured draft from ${activeAi.name}!`, 'success');
    } catch (err) {
      showToast(`Capture failed: ${err.message}`, 'error');
    } finally {
      navCaptureBtn.classList.remove('primary-nav-btn');
    }
  });

  navSidepanelBtn.addEventListener('click', async () => {
    try {
      const window = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: window.id });
      showToast('Opened in Chrome Side Panel!', 'success');
    } catch (err) {
      showToast('Side panel opened or already active.', 'info');
    }
  });

  navSettingsBtn.addEventListener('click', () => {
    const isVisible = !settingsPanel.classList.contains('hidden');
    hideAllPanels();
    if (!isVisible) {
      renderApiSettings();
      settingsPanel.classList.remove('hidden');
    }
  });

  navImportBtn.addEventListener('click', () => {
    const isVisible = !importPanel.classList.contains('hidden');
    hideAllPanels();
    if (!isVisible) {
      importPanel.classList.remove('hidden');
    }
  });

  closeFormBtn.addEventListener('click', () => formPanel.classList.add('hidden'));
  cancelFormBtn.addEventListener('click', () => formPanel.classList.add('hidden'));
  closeVariablesBtn.addEventListener('click', () => variablesPanel.classList.add('hidden'));
  closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  closeImportBtn.addEventListener('click', () => importPanel.classList.add('hidden'));

  // --- Category Chips Filtering ---
  filterChipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    filterChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilterCategory = chip.dataset.cat;
    renderPrompts();
  });

  sortSelect.addEventListener('change', renderPrompts);

  searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('hidden', !searchInput.value);
    renderPrompts();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderPrompts();
    searchInput.focus();
  });

  // --- Settings & API Sync ---
  function renderApiSettings() {
    if (apiConfig.isVerified && apiConfig.userId) {
      unverifiedBox.classList.add('hidden');
      verifiedBox.classList.remove('hidden');
      verifiedUserEmail.textContent = apiConfig.email;
      verifiedUserId.textContent = `User ID: ${apiConfig.userId} ${apiConfig.userName ? `(${apiConfig.userName})` : ''}`;
      apiEmailInput.disabled = false;
      apiCodeInput.value = '';
      verifyCodeRow.classList.add('hidden');
      if (changeEmailBtn) changeEmailBtn.classList.add('hidden');
      sendCodeBtn.textContent = 'Send Code';
    } else {
      unverifiedBox.classList.remove('hidden');
      verifiedBox.classList.add('hidden');
      apiEmailInput.value = apiConfig.email || '';
      apiEmailInput.disabled = false;
      apiCodeInput.value = '';
      verifyCodeRow.classList.add('hidden');
      if (changeEmailBtn) changeEmailBtn.classList.add('hidden');
      sendCodeBtn.textContent = 'Send Code';
    }
  }

  prefFloatingWidget.addEventListener('change', async () => {
    userSettings.hideFloatingWidget = !prefFloatingWidget.checked;
    await chrome.storage.local.set({ settings: userSettings });
    showToast('Preference saved.', 'success');
  });

  function updateConnectionStatusUI() {
    if (apiConfig.isVerified && apiConfig.userId) {
      connectionBadge.className = 'badge badge-online';
      badgeText.textContent = `BlogCutter (#${apiConfig.userId})`;
      connectionBadge.title = `Connected to BlogCutter as ${apiConfig.email}`;
      footerSyncStatus.textContent = `☁️ Synced with BlogCutter`;
    } else {
      connectionBadge.className = 'badge badge-offline';
      badgeText.textContent = 'Local Mode';
      connectionBadge.title = 'Saved in browser only. Connect BlogCutter account to sync live.';
      footerSyncStatus.textContent = `💻 Local Browser Storage`;
    }
  }

  // Email OTP Flow
  sendCodeBtn.addEventListener('click', async () => {
    const email = apiEmailInput.value.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    const baseUrl = (apiConfig.baseUrl || LIVE_URL).replace(/\/+$/, '');
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = 'Sending...';

    try {
      const res = await callApi(`${baseUrl}/prompt-saver/connect`, 'POST', { email }, `${baseUrl}/prompts/connect`);
      if (res && res.status === 'success') {
        apiConfig.email = email;
        // Disable email field so user doesn't accidentally edit it while entering code
        apiEmailInput.disabled = true;
        sendCodeBtn.textContent = 'Resend';
        if (changeEmailBtn) changeEmailBtn.classList.remove('hidden');

        verifyCodeRow.classList.remove('hidden');
        apiCodeInput.value = '';
        apiCodeInput.focus();
        showToast(res.message || 'Verification code sent to email!', 'success');

        if (res.dev_code) {
          codeHint.textContent = `Dev / Test Code: ${res.dev_code}`;
        } else {
          codeHint.textContent = 'Check your email inbox or spam folder for the 6-digit code.';
        }
      } else {
        showToast(res?.message || 'Failed to send verification code.', 'error');
      }
    } catch (err) {
      showToast(`Connection error: ${err.message}`, 'error');
    } finally {
      sendCodeBtn.disabled = false;
    }
  });

  if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
      apiEmailInput.disabled = false;
      apiEmailInput.focus();
      changeEmailBtn.classList.add('hidden');
      sendCodeBtn.textContent = 'Send Code';
      verifyCodeRow.classList.add('hidden');
      apiCodeInput.value = '';
      codeHint.textContent = '';
    });
  }

  verifyCodeBtn.addEventListener('click', async () => {
    const code = apiCodeInput.value.trim();
    const email = apiEmailInput.value.trim() || apiConfig.email;
    if (!code) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }

    const baseUrl = (apiConfig.baseUrl || LIVE_URL).replace(/\/+$/, '');
    verifyCodeBtn.disabled = true;
    verifyCodeBtn.textContent = 'Verifying...';

    try {
      const res = await callApi(`${baseUrl}/prompt-saver/verify`, 'POST', { email, code }, `${baseUrl}/prompts/verify`);
      if (res && res.status === 'success') {
        apiConfig.isVerified = true;
        apiConfig.baseUrl = baseUrl;
        apiConfig.email = email;
        apiConfig.userId = res.user?.id || null;
        apiConfig.userName = res.user?.name || '';
        apiConfig.apiKey = res.user?.api_key || null;

        // Clear and remove unverified form
        apiCodeInput.value = '';
        apiEmailInput.disabled = false;
        verifyCodeRow.classList.add('hidden');
        if (changeEmailBtn) changeEmailBtn.classList.add('hidden');
        unverifiedBox.classList.add('hidden');
        verifiedBox.classList.remove('hidden');

        // Merge server prompts into local
        const serverPrompts = res.prompts || [];
        await mergeServerPromptsIntoLocal(serverPrompts);

        await chrome.storage.local.set({ api_config: apiConfig });

        renderApiSettings();
        updateConnectionStatusUI();
        showToast('Email verified! Server prompts synced with BlogCutter.', 'success');

        // Sync local prompts to server
        await syncLocalPromptsToLive();
      } else {
        showToast(res?.message || 'Verification failed. Code may be incorrect.', 'error');
      }
    } catch (err) {
      showToast(`Verification error: ${err.message}`, 'error');
    } finally {
      verifyCodeBtn.disabled = false;
      verifyCodeBtn.textContent = 'Verify & Sync';
    }
  });

  disconnectBtn.addEventListener('click', async () => {
    if (confirm('Disconnect from BlogCutter? Your prompts will remain safely in your browser.')) {
      apiConfig.isVerified = false;
      apiConfig.userId = null;
      apiEmailInput.disabled = false;
      apiCodeInput.value = '';
      verifyCodeRow.classList.add('hidden');
      if (changeEmailBtn) changeEmailBtn.classList.add('hidden');
      sendCodeBtn.textContent = 'Send Code';
      await chrome.storage.local.set({ api_config: apiConfig });
      renderApiSettings();
      updateConnectionStatusUI();
      renderPrompts();
      showToast('Disconnected. Running in Local Mode.', 'info');
    }
  });

  syncNowBtn.addEventListener('click', async () => {
    syncNowBtn.disabled = true;
    syncNowBtn.textContent = 'Syncing...';
    try {
      await fetchServerPrompts();
      await syncLocalPromptsToLive();
      showToast('Sync complete! Local and BlogCutter are up to date.', 'success');
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      syncNowBtn.disabled = false;
      syncNowBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/></svg>
        Sync Now
      `;
    }
  });

  // --- Prompts CRUD ---
  savePromptBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categorySelect.value || 'General';
    const editId = editIdInput.value;
    const editServerId = editServerIdInput.value;

    if (!content) {
      showToast('Please enter prompt content', 'error');
      return;
    }

    savePromptBtn.disabled = true;

    try {
      let promptToSave;
      const now = new Date().toISOString();

      if (editId) {
        const index = allPrompts.findIndex(p => String(p.id) === String(editId));
        if (index !== -1) {
          allPrompts[index].title = title || 'Untitled Prompt';
          allPrompts[index].content = content;
          allPrompts[index].category = category;
          allPrompts[index].updated_at = now;
          promptToSave = allPrompts[index];
        }
      } else {
        promptToSave = {
          id: Date.now(),
          server_id: null,
          title: title || content.split('\n')[0].substring(0, 35) || 'New Prompt',
          content: content,
          category: category,
          is_favorite: false,
          use_count: 0,
          created_at: now,
          updated_at: now,
          synced: false
        };
        allPrompts.unshift(promptToSave);
      }

      await chrome.storage.local.set({ prompts: allPrompts });

      // Save to blogcutter.com live database
      if (apiConfig.isVerified && apiConfig.userId) {
        const payload = {
          user_id: Number(apiConfig.userId),
          title: promptToSave.title,
          content: promptToSave.content
        };

        if (promptToSave.server_id) {
          payload.id = promptToSave.server_id;
          payload.server_id = promptToSave.server_id;
        }

        try {
          const res = await callApi(
            `${apiConfig.baseUrl}/prompt-saver/save`,
            'POST',
            payload,
            `${apiConfig.baseUrl}/prompts/save`
          );

          if (res && res.status === 'success' && res.prompt) {
            promptToSave.server_id = res.prompt.id;
            promptToSave.synced = true;
            await chrome.storage.local.set({ prompts: allPrompts });
            showToast('Prompt saved to local & BlogCutter! ☁️', 'success');
          } else {
            showToast('Saved locally. (BlogCutter returned status error)', 'warning');
          }
        } catch (serverErr) {
          showToast('Saved locally. (BlogCutter offline)', 'info');
        }
      } else {
        showToast('Prompt saved locally! 💻', 'success');
      }

      resetPromptForm();
      formPanel.classList.add('hidden');
      renderPrompts();
      chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', count: allPrompts.length });
    } finally {
      savePromptBtn.disabled = false;
    }
  });

  async function deletePrompt(id) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    const target = allPrompts.find(p => String(p.id) === String(id));
    allPrompts = allPrompts.filter(p => String(p.id) !== String(id));
    await chrome.storage.local.set({ prompts: allPrompts });

    if (target && target.server_id && apiConfig.isVerified && apiConfig.userId) {
      try {
        await callApi(
          `${apiConfig.baseUrl}/prompt-saver/delete`,
          'POST',
          { user_id: apiConfig.userId, id: target.server_id },
          `${apiConfig.baseUrl}/prompts/delete`
        );
      } catch (e) {
        console.warn('Failed to delete on server:', e);
      }
    }

    renderPrompts();
    showToast('Prompt deleted.', 'info');
    chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', count: allPrompts.length });
  }

  function editPrompt(id) {
    const prompt = allPrompts.find(p => String(p.id) === String(id));
    if (!prompt) return;

    hideAllPanels();
    editIdInput.value = prompt.id;
    editServerIdInput.value = prompt.server_id || '';
    titleInput.value = prompt.title || '';
    categorySelect.value = prompt.category || 'General';
    contentInput.value = prompt.content || '';
    formTitle.textContent = 'Edit Prompt';
    formPanel.classList.remove('hidden');
    contentInput.focus();
  }

  function resetPromptForm() {
    editIdInput.value = '';
    editServerIdInput.value = '';
    titleInput.value = '';
    categorySelect.value = 'General';
    contentInput.value = '';
    formTitle.textContent = 'Create New Prompt';
  }

  async function toggleFavorite(id) {
    const prompt = allPrompts.find(p => String(p.id) === String(id));
    if (!prompt) return;

    prompt.is_favorite = !prompt.is_favorite;
    await chrome.storage.local.set({ prompts: allPrompts });
    renderPrompts();
  }

  // --- Variables Handling ---
  function extractVariables(text) {
    const matches = new Set();
    // {{variable}} or {variable} or [variable]
    const curlyDouble = text.match(/\{\{([^}]+)\}\}/g);
    if (curlyDouble) {
      curlyDouble.forEach(m => matches.add(m.slice(2, -2).trim()));
    }
    const bracket = text.match(/\[([a-zA-Z0-9_\s-]+)\]/g);
    if (bracket) {
      bracket.forEach(m => matches.add(m.slice(1, -1).trim()));
    }
    return Array.from(matches);
  }

  function showVariablesModal(prompt) {
    activePromptForVariables = prompt;
    const vars = extractVariables(prompt.content);
    varTargetAi.textContent = activeAi.name;
    varInputsContainer.innerHTML = '';

    vars.forEach(v => {
      const row = document.createElement('div');
      row.className = 'var-input-row';
      row.innerHTML = `
        <label class="form-label">${escapeHtml(v)}</label>
        <input type="text" class="var-field" data-var="${escapeHtml(v)}" placeholder="Value for ${escapeHtml(v)}...">
      `;
      varInputsContainer.appendChild(row);
    });

    updateCompiledVariablePreview();

    // Listen to changes
    varInputsContainer.querySelectorAll('.var-field').forEach(input => {
      input.addEventListener('input', updateCompiledVariablePreview);
    });

    hideAllPanels();
    variablesPanel.classList.remove('hidden');
    const firstInput = varInputsContainer.querySelector('.var-field');
    if (firstInput) firstInput.focus();
  }

  function compilePromptWithVariables(template) {
    let result = template;
    const inputs = varInputsContainer.querySelectorAll('.var-field');
    inputs.forEach(input => {
      const varName = input.dataset.var;
      const val = input.value.trim() || `[${varName}]`;
      // Replace {{varName}} and [varName]
      result = result.replaceAll(`{{${varName}}}`, val);
      result = result.replaceAll(`[${varName}]`, val);
    });
    return result;
  }

  function updateCompiledVariablePreview() {
    if (!activePromptForVariables) return;
    const compiled = compilePromptWithVariables(activePromptForVariables.content);
    varCompiledPreview.textContent = compiled;
  }

  insertCompiledBtn.addEventListener('click', async () => {
    if (!activePromptForVariables) return;
    const compiled = compilePromptWithVariables(activePromptForVariables.content);
    await executeInsertPrompt(compiled, activePromptForVariables.id);
    variablesPanel.classList.add('hidden');
  });

  copyCompiledBtn.addEventListener('click', async () => {
    if (!activePromptForVariables) return;
    const compiled = compilePromptWithVariables(activePromptForVariables.content);
    await copyToClipboard(compiled);
    showToast('Copied filled prompt to clipboard!', 'success');
  });

  insertRawBtn.addEventListener('click', async () => {
    if (!activePromptForVariables) return;
    await executeInsertPrompt(activePromptForVariables.content, activePromptForVariables.id);
    variablesPanel.classList.add('hidden');
  });

  // --- Insertion Engine ---
  async function executeInsertPrompt(text, promptId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        await copyToClipboard(text);
        showToast('Copied to clipboard (no active tab found)', 'info');
        return;
      }

      // Increment usage count
      if (promptId) {
        const p = allPrompts.find(item => String(item.id) === String(promptId));
        if (p) {
          p.use_count = (p.use_count || 0) + 1;
          await chrome.storage.local.set({ prompts: allPrompts });
        }
      }

      // Try sending message to content script
      let inserted = false;
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'INSERT_PROMPT',
          text: text
        });
        if (response && response.success) {
          inserted = true;
        }
      } catch (e) {
        // Fallback: executeScript
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (textToPaste) => {
            const editor = document.querySelector('#prompt-textarea') ||
                           document.querySelector('div[contenteditable="true"].ProseMirror') ||
                           document.querySelector('div[contenteditable="true"]') ||
                           document.querySelector('rich-textarea div[contenteditable="true"]') ||
                           document.querySelector('textarea#chat-input') ||
                           document.querySelector('textarea');
            if (editor) {
              editor.focus();
              if (editor.tagName.toLowerCase() === 'textarea' || editor.tagName.toLowerCase() === 'input') {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (nativeSetter) nativeSetter.call(editor, textToPaste);
                else editor.value = textToPaste;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                editor.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, textToPaste);
                editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: textToPaste }));
              }
            }
          },
          args: [text]
        });
        inserted = true;
      }

      // Copy to clipboard as well for safety
      await copyToClipboard(text);

      if (inserted) {
        showToast(`Inserted into ${activeAi.name} & copied! ⚡`, 'success');
      } else {
        showToast(`Copied to clipboard (paste with Ctrl+V into ${activeAi.name})`, 'info');
      }
    } catch (err) {
      await copyToClipboard(text);
      showToast(`Copied to clipboard! (${err.message})`, 'info');
    }
  }

  // --- Render Prompts List ---
  function renderPrompts() {
    const query = searchInput.value.trim().toLowerCase();
    const sortMode = sortSelect.value;

    let filtered = allPrompts.filter(p => {
      // Category filter
      if (activeFilterCategory === 'starred' && !p.is_favorite) return false;
      if (activeFilterCategory !== 'all' && activeFilterCategory !== 'starred' && p.category !== activeFilterCategory) return false;

      // Text search
      if (!query) return true;
      return (p.title && p.title.toLowerCase().includes(query)) ||
             (p.content && p.content.toLowerCase().includes(query)) ||
             (p.category && p.category.toLowerCase().includes(query));
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortMode === 'favorites') {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return (new Date(b.created_at || 0)) - (new Date(a.created_at || 0));
      }
      if (sortMode === 'most_used') {
        return (b.use_count || 0) - (a.use_count || 0);
      }
      if (sortMode === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // default: newest
      return (new Date(b.created_at || 0)) - (new Date(a.created_at || 0));
    });

    promptsCounter.textContent = `${filtered.length} of ${allPrompts.length} prompts`;
    promptListContainer.innerHTML = '';

    if (filtered.length === 0) {
      promptListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${query ? '🔍' : '📝'}</div>
          <p class="empty-title">${query ? 'No matching prompts' : 'No prompts in this category'}</p>
          <p class="empty-desc">${query ? 'Try a different search term or clear the filter.' : 'Click <strong>+ New</strong> or <strong>Capture</strong> above to add one!'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(prompt => {
      const card = document.createElement('div');
      card.className = 'prompt-card';

      const isLive = Boolean(prompt.server_id || prompt.synced);
      const syncStatusText = isLive ? '☁️ BlogCutter' : '💻 Local';
      const variables = extractVariables(prompt.content);
      const categoryLabel = prompt.category || 'General';

      let varsHtml = '';
      if (variables.length > 0) {
        varsHtml = `
          <div class="variables-pill-row">
            ${variables.map(v => `<span class="variable-badge">{${escapeHtml(v)}}</span>`).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <span class="card-title" title="${escapeHtml(prompt.title)}">${escapeHtml(prompt.title)}</span>
            <span class="category-pill">${escapeHtml(categoryLabel)}</span>
          </div>
          <button class="star-btn ${prompt.is_favorite ? 'starred' : ''}" title="${prompt.is_favorite ? 'Unstar' : 'Star (Favorite)'}">
            ${prompt.is_favorite ? '⭐' : '☆'}
          </button>
        </div>

        <div class="card-body" title="Click to insert into ${activeAi.name}">
          <div class="card-preview">${escapeHtml(prompt.content)}</div>
          ${varsHtml}
        </div>

        <div class="card-bottom">
          <div class="card-meta">
            <span class="sync-status-icon" title="${syncStatusText}">${syncStatusText}</span>
            ${prompt.use_count ? `<span>• Used ${prompt.use_count}x</span>` : ''}
          </div>

          <div class="card-actions">
            <button class="card-action-btn insert-action-btn" title="Insert into ${activeAi.name}">
              <span>⚡ ${activeAi.name.split(' ')[0]}</span>
            </button>
            <button class="card-action-btn copy-btn" title="Copy to clipboard">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="card-action-btn edit-btn" title="Edit prompt">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="card-action-btn delete-btn" title="Delete prompt">&times;</button>
          </div>
        </div>
      `;

      // Click card body or Insert button
      const handleInsert = async () => {
        if (variables.length > 0) {
          showVariablesModal(prompt);
        } else {
          await executeInsertPrompt(prompt.content, prompt.id);
        }
      };

      card.querySelector('.card-body').addEventListener('click', handleInsert);
      card.querySelector('.insert-action-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleInsert();
      });

      card.querySelector('.star-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(prompt.id);
      });

      card.querySelector('.copy-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await copyToClipboard(prompt.content);
        showToast('Copied to clipboard!', 'info');
      });

      card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        editPrompt(prompt.id);
      });

      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePrompt(prompt.id);
      });

      promptListContainer.appendChild(card);
    });
  }

  // --- Import / Export Handlers ---
  executeImportBtn.addEventListener('click', async () => {
    const raw = importTextInput.value.trim();
    if (!raw) {
      showToast('Please paste prompts to import', 'error');
      return;
    }

    let parsedList = [];
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) {
        const json = JSON.parse(raw);
        parsedList = Array.isArray(json) ? json : [json];
      } else {
        parsedList = raw.split(/\n\s*\n/).map(block => ({
          title: block.trim().substring(0, 35),
          content: block.trim(),
          category: 'General'
        }));
      }
    } catch (e) {
      showToast('Invalid JSON syntax. Please check formatting.', 'error');
      return;
    }

    if (parsedList.length === 0) {
      showToast('No valid prompts found to import.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const newItems = parsedList.map(item => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      server_id: item.server_id || item.id || null,
      title: item.title || item.content?.substring(0, 35) || 'Imported Prompt',
      content: item.content || '',
      category: item.category || 'General',
      is_favorite: Boolean(item.is_favorite),
      use_count: Number(item.use_count || 0),
      created_at: now,
      updated_at: now,
      synced: false
    })).filter(item => item.content);

    allPrompts = [...newItems, ...allPrompts];
    await chrome.storage.local.set({ prompts: allPrompts });

    const shouldSyncLive = importSyncLiveCheckbox.checked && apiConfig.isVerified && apiConfig.userId;
    if (shouldSyncLive) {
      try {
        const importPayload = newItems.map(item => ({
          title: item.title,
          content: item.content,
          server_id: item.server_id || null
        }));

        const res = await callApi(
          `${apiConfig.baseUrl}/prompt-saver/sync`,
          'POST',
          { user_id: Number(apiConfig.userId), prompts: importPayload },
          `${apiConfig.baseUrl}/prompts/sync`
        );
        if (res && res.prompts) {
          await mergeServerPromptsIntoLocal(res.prompts);
        }
        showToast(`Imported ${newItems.length} prompts & synced with BlogCutter! ☁️`, 'success');
      } catch (e) {
        showToast(`Imported locally. Live sync failed: ${e.message}`, 'warning');
      }
    } else {
      showToast(`Imported ${newItems.length} prompts locally! 💻`, 'success');
    }

    importTextInput.value = '';
    importPanel.classList.add('hidden');
    renderPrompts();
    chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', count: allPrompts.length });
  });

  exportJsonBtn.addEventListener('click', () => {
    if (allPrompts.length === 0) {
      showToast('No prompts to export', 'info');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPrompts, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `blogcutter_prompts_backup_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Exported prompts to JSON file', 'success');
  });

  // --- Sync Helpers ---
  async function mergeServerPromptsIntoLocal(serverPrompts) {
    if (!Array.isArray(serverPrompts)) return;

    for (const sp of serverPrompts) {
      const existing = allPrompts.find(p =>
        (p.server_id && String(p.server_id) === String(sp.id)) ||
        (p.title === sp.title && p.content === sp.content)
      );

      if (existing) {
        existing.server_id = sp.id;
        existing.title = sp.title;
        existing.content = sp.content;
        existing.synced = true;
      } else {
        allPrompts.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          server_id: sp.id,
          title: sp.title,
          content: sp.content,
          category: 'General',
          is_favorite: false,
          use_count: 0,
          created_at: sp.created_at,
          updated_at: sp.updated_at,
          synced: true
        });
      }
    }

    await chrome.storage.local.set({ prompts: allPrompts });
    renderPrompts();
  }

  async function fetchServerPrompts() {
    if (!apiConfig.isVerified || !apiConfig.userId) return;
    const res = await callApi(
      `${apiConfig.baseUrl}/prompt-saver/prompts`,
      'POST',
      { user_id: apiConfig.userId },
      `${apiConfig.baseUrl}/prompts/list`
    );
    if (res && res.prompts) {
      await mergeServerPromptsIntoLocal(res.prompts);
    }
  }

  async function syncLocalPromptsToLive() {
    if (!apiConfig.isVerified || !apiConfig.userId) return;
    const unsynced = allPrompts.filter(p => !p.server_id);
    if (unsynced.length === 0) return;

    const promptsPayload = unsynced.map(p => ({
      title: p.title,
      content: p.content,
      server_id: p.server_id || null
    }));

    const res = await callApi(
      `${apiConfig.baseUrl}/prompt-saver/sync`,
      'POST',
      { user_id: Number(apiConfig.userId), prompts: promptsPayload },
      `${apiConfig.baseUrl}/prompts/sync`
    );

    if (res && res.prompts) {
      await mergeServerPromptsIntoLocal(res.prompts);
    }
  }

  // Dual API caller
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
      const rawText = await response.text();
      return {
        status: 'error',
        message: `HTTP ${response.status}: ${rawText.substring(0, 100)}`
      };
    }

    try {
      const result = await attempt(primaryUrl);
      if (result && result.status !== 'error') return result;
      if (fallbackUrl) {
        return await attempt(fallbackUrl);
      }
      return result;
    } catch (err) {
      if (fallbackUrl) {
        return await attempt(fallbackUrl);
      }
      throw err;
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  let toastTimeout;
  function showToast(message, type = 'info') {
    clearTimeout(toastTimeout);
    toastBanner.className = `toast ${type}`;
    toastBanner.textContent = message;
    toastBanner.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toastBanner.classList.add('hidden');
    }, 3500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Focus search on '/'
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
    // Escape closes modals
    if (e.key === 'Escape') {
      hideAllPanels();
    }
    // Ctrl+N creates new
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      navNewBtn.click();
    }
  });
});