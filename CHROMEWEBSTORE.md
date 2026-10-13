# Chrome Web Store Listing — BlogCutter Universal AI Prompt Saver Pro

**Last Updated:** 2026-10-13  
**Extension Name:** BlogCutter - Universal AI Prompt Saver Pro  
**Version:** 2.0.0  
**Manifest Version:** 3  
**Website:** https://blogcutter.com  

---

## 1. Store Listing Metadata

### Short Description (max 132 chars)
Save, organize, and 1-click insert prompts into ChatGPT, Claude, Gemini, DeepSeek & any AI. Sync live with BlogCutter.com.

### Detailed Description
Boost your AI productivity with BlogCutter Prompt Saver Pro — the universal prompt manager built for creators, developers, marketers, and power users.

Save your best prompt templates, organize them with categories and tags, and insert them directly into any AI chat interface with a single click.

KEY FEATURES:
• Universal AI Compatibility: Works seamlessly with Claude, ChatGPT, Google Gemini, DeepSeek, Perplexity, Microsoft Copilot, Poe, Grok, and any web-based AI interface.
• 1-Click Prompt Insertion: Inserts your saved prompts directly into chat input boxes with proper formatting and cursor positioning.
• 1-Click Draft Capture: Easily capture and save draft prompts directly from Claude, ChatGPT, or DeepSeek before sending.
• Dynamic Variables: Use {{variable}} or [topic] placeholders. Fill values on the fly with a prompt preview before insertion.
• In-Page Floating Quick Launcher: Press Alt+P on supported AI websites to search and insert prompts instantly without leaving your chat.
• Side Panel Docking: Keep your prompt library open and accessible in Chrome's Side Panel while chatting full-screen.
• Right-Click Quick Save: Highlight any text on the web, right-click, and save it immediately as a prompt template.
• Cloud Sync with BlogCutter.com: Securely sync your prompt library to your BlogCutter account across all your devices using email OTP verification.
• Offline First: Operates smoothly offline with local browser storage, syncing automatically when connected.
• Categories & Starred Favorites: Organize prompts into SEO, Coding, Writing, Business, Creative, or General categories.

PRIVACY FIRST:
Your prompt data belongs to you. Prompts are stored locally in your browser and only synced with your personal account on BlogCutter.com when you choose to connect.

---

## 2. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store and persist user prompt templates, user preferences, and sync state locally in the browser. |
| `activeTab` | Required to interact with the current AI website when the user triggers prompt insertion or capture via the extension icon. |
| `scripting` | Required to programmatically insert prompt text into diverse AI input editors (React, ProseMirror, Quill) when content scripts are awaiting activation. |
| `clipboardWrite` | Required to allow users to copy prompt templates to their system clipboard with one click. |
| `contextMenus` | Required to provide a right-click context menu option allowing users to save selected web text directly into their prompt library. |
| `sidePanel` | Required to allow users to open and dock the prompt library inside Chrome's native Side Panel while chatting with AI tools. |
| `tabs` | Required to identify the active tab's domain to detect whether the user is on Claude, ChatGPT, Gemini, or DeepSeek, and to open the Side Panel for the active window. |

### Host Permissions Justification

| Host Permission | Justification |
| :--- | :--- |
| `https://blogcutter.com/*` | Required to connect with the BlogCutter API to synchronize saved prompt templates with the user's account. |
| `http://127.0.0.1/*`, `http://localhost/*` | Required for local development and self-hosted testing of the BlogCutter backend API. |
| `https://*/*`, `http://*/*` | Required to enable the universal prompt insertion and draft capture feature across diverse AI platforms and web text areas. |

---

## 3. Privacy & Data Use Disclosure

- **Single Purpose:** Save, manage, and insert AI prompt templates into web-based text inputs and synchronize them with BlogCutter.com.
- **Personal Communications:** Not collected or transmitted to third parties. Only user-created prompt templates are saved locally and synced to the user's BlogCutter account upon explicit login.
- **Personally Identifiable Information:** The user's email address is used solely for optional account connection and OTP verification on BlogCutter.com.
- **No Third-Party Tracking or Ads:** The extension contains zero trackers, analytics scripts, or advertisements.

---

## 4. Release History

- **v2.0.0 (2026-10-13):**
  - Upgraded to BlogCutter Universal AI Prompt Saver Pro.
  - Added native compatibility for Claude, ChatGPT, Gemini, DeepSeek, Perplexity, Poe, and Copilot.
  - Corrected official live API domain to `https://blogcutter.com/api`.
  - Added in-page floating quick launcher widget with `Alt+P` keyboard shortcut.
  - Added 1-click prompt draft capture from active AI chat.
  - Added dynamic prompt variables modal with live compilation preview.
  - Added Chrome Side Panel support.
  - Added context menu right-click text capture.
  - Added categories, tag filtering, starred favorites, and usage count sorting.
  - Added Manifest V3 background service worker and responsive modern dark theme.
- **v1.1.0:**
  - Initial Gemini and local storage prototype.
