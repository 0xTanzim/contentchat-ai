# Translation Service Crash - Bug Analysis

## 🚨 ISSUE: Chrome Translation Service Crashes After Model Download

### Quick Summary

- ✅ **Flags**: All enabled correctly
- ✅ **Model**: `en-fr` installed successfully
- ✅ **API**: `availability()` returns "available"
- ✅ **Download**: Completes 0% → 100%
- ❌ **Service**: Crashes during translator creation
- ❌ **Error**: `NotSupportedError` (misleading - should be service crash error)

**Root Cause**: Chrome internal bug in translation service startup, NOT our code.

See **docs/TRANSLATION_BUG_ANALYSIS.md** for full diagnostic guide.

---

## chrome://on-device-translation-internals Status

Language Packages
en - es Installed Uninstall
en - ja Installed Uninstall
ar - en Not installed Install
bn - en Not installed Install
de - en Not installed Install
en - fr Installed Uninstall
en - hi Not installed Install
en - it Not installed Install
en - ko Not installed Install
en - nl Not installed Install
en - pl Not installed Install
en - pt Not installed Install
en - ru Installed Uninstall
en - th Not installed Install
en - tr Not installed Install
en - vi Not installed Install
en - zh Not installed Install
en - zh-Hant Not installed Install
bg - en Not installed Install
cs - en Not installed Install
da - en Not installed Install
el - en Not installed Install
en - fi Installed Uninstall
en - hr Not installed Install
en - hu Not installed Install
en - id Not installed Install
en - iw Not installed Install
en - lt Not installed Install
en - no Not installed Install
en - ro Not installed Install
en - sk Not installed Install
en - sl Not installed Install
en - sv Not installed Install
en - uk Not installed Install
en - kn Not installed Install
en - ta Not installed Install
en - te Not installed Install
en - mr Not installed Install
================================================

[[[
Object 'Background service worker started'
logger-kb-gjBN7.js:1 Object 'Context menus created'
logger-kb-gjBN7.js:1 Object 'Background received message:' Object
logger-kb-gjBN7.js:1 Object 'Content script ready on:' 'https://artificialanalysis.ai/models?models=gpt-5-minimal%2Cgpt-5%2Cgpt-5-mini%2Cgpt-5-medium%2Cgpt-5-low%2Cgpt-5-codex'
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChatView] 📺 ChatView: Rendering state {"messagesCount":0,"hasStreamingMessage":false,"isStreaming":false}
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [useConversationManager] 🎬 Initializing conversation...
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [useConversationManager] 🏭 Factory: Creating/finding conversation {"mode":"page-context"}
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [useConversationManager] 🆕 Creating new conversation
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChromeExtensionService] Loading page content
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChromeExtensionService] Listening to runtime messages
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChromeExtensionService] Listening to tab updates
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChromeExtensionService] Listening to tab activation
logger-kb-gjBN7.js:1 3:11:50 PM 🐛 [ChatView] 📺 ChatView: Rendering state {"messagesCount":0,"hasStreamingMessage":false,"isStreaming":false}
logger-kb-gjBN7.js:1 3:11:51 PM 🐛 [ChromeExtensionService] Content loaded {"title":"Comparison of AI Models across Intelligence, Performance, Price | Artificial Analysis","url":"https://artificialanalysis.ai/models?models=gpt-5-minimal%2Cgpt-5%2Cgpt-5-mini%2Cgpt-5-medium%2Cgpt-5-low%2Cgpt-5-codex","contentLength":44595}
logger-kb-gjBN7.js:1 3:11:51 PM 🐛 [useChromeExtension] Page content loaded {"title":"Comparison of AI Models across Intelligence, Performance, Price | Artificial Analysis","url":"https://artificialanalysis.ai/models?models=gpt-5-minimal%2Cgpt-5%2Cgpt-5-mini%2Cgpt-5-medium%2Cgpt-5-low%2Cgpt-5-codex"}
logger-kb-gjBN7.js:1 3:11:51 PM 🐛 [ChatView] 📺 ChatView: Rendering state {"messagesCount":0,"hasStreamingMessage":false,"isStreaming":false}
logger-kb-gjBN7.js:1 3:11:51 PM 🐛 [useConversationManager] 📝 Context changed, finding appropriate conversation
2logger-kb-gjBN7.js:1 3:11:51 PM 🐛 [ChatView] 📺 ChatView: Rendering state {"messagesCount":0,"hasStreamingMessage":false,"isStreaming":false}
logger-kb-gjBN7.js:1 3:12:23 PM ℹ️ [useTranslator] 🌐 Starting translation {"sourceLanguage":"en","targetLanguage":"fr","length":71,"streaming":false}
2logger-kb-gjBN7.js:1 3:12:23 PM ℹ️  Translator availability for en → fr: available
logger-kb-gjBN7.js:1 3:12:23 PM ℹ️  Translation model download: 0%
logger-kb-gjBN7.js:1 3:12:23 PM ℹ️ [useTranslator] Translation model download: 0%
logger-kb-gjBN7.js:1 3:12:23 PM ℹ️  Translation model download: 100%
logger-kb-gjBN7.js:1 3:12:23 PM ℹ️ [useTranslator] Translation model download: 100%
Summarizing…Tell me moreThe text above has been generated with AI on your local device. Clicking the button will send the console message, stack trace, related source code, and the associated network headers to Google to generate a more detailed explanation.Learn more about AI summariesDon’t showindex.html:1 The translation service crashed.Understand this warning
3:12:23 PM ❌  Failed to create translator: {"name":"NotSupportedError"The error indicates that the code couldn't create a translator object because it couldn't find a suitable translator for the specified source and target languages. This likely means the language pair is not supported by the system or configurationTell me moreThe text above has been generated with AI on your local device. Clicking the button will send the console message, stack trace, related source code, and the associated network headers to Google to generate a more detailed explanation.Learn more about AI summariesDon’t showlogger-kb-gjBN7.js:1 3:12:23 PM ❌  Failed to create translator: {"name":"NotSupportedError","message":"Unable to create translator for the given source and target language.","stack":"NotSupportedError: Unable to create translator for the given source and target language."}
error @ logger-kb-gjBN7.js:1Understand this error
Summarizing…Tell me moreThe text above has been generated with AI on your local device. Clicking the button will send the console message, stack trace, related source code, and the associated network headers to Google to generate a more detailed explanation.Learn more about AI summariesDon’t showlogger-kb-gjBN7.js:1 3:12:23 PM ❌ [useTranslator] ❌ Translation failed: {"name":"Error","message":"Failed to create translator: Unable to create translator for the given source and target language.","stack":"Error: Failed to create translator: Unable to create translator for the given source and target language.\n    at me (chrome-extension://jghehklkabepdeknpgbbegdpccboompo/assets/useTranslator-BT6YFZb7.js:21:21)\n    at async Object.translate (chrome-extension://jghehklkabepdeknpgbbegdpccboompo/assets/useTranslator-BT6YFZb7.js:21:2224)\n    at async b (chrome-extension://jghehklkabepdeknpgbbegdpccboompo/assets/TranslateView-D5X0PjVE.js:41:25851)"}
error @ logger-kb-gjBN7.js:1Understand this error]]]
