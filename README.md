# ContentChat AI

> Privacy-first AI reading assistant powered by Chrome Built-in AI

[![Chrome Built-in AI Challenge 2025](https://img.shields.io/badge/Google%20Chrome-Built--in%20AI%20Challenge%202025-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://googlechromeai2025.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A Chrome Extension that brings intelligent content interaction directly to your browser using on-device AI. No data sent to servers, no API keys required - everything runs locally using Chrome's Gemini Nano.

## 🏆 Google Chrome Built-in AI Challenge 2025

This project was built for the **Google Chrome Built-in AI Challenge 2025**, showcasing the power of on-device AI using Gemini Nano.

### 📹 Project Videos

- **🎬 Feature Demo** (2:40): https://youtu.be/ridT8FSLx0k

[![Feature Demo](https://img.youtube.com/vi/ridT8FSLx0k/0.jpg)](https://youtu.be/ridT8FSLx0k)

- **📚 Setup Tutorial**: [How to Enable Chrome's Built-in AI](https://www.youtube.com/watch?v=finN5PfJyCg) - Step-by-step guide to enable Chrome AI flags

### 🔗 Links

- **GitHub Repository**: https://github.com/0xTanzim/contentchat-ai
- **Developer**: [@0xTanzim](https://github.com/0xtanzim)

## ✨ Features

### 🤖 Smart Summarization

Generate key-points, TL;DR, teasers, or headlines from any webpage with streaming support. Powered by **Summarizer API**.

### 💬 Intelligent Chat

Ask questions about page content or have personal AI conversations with context awareness. Powered by **Prompt API (LanguageModel)**.

### ✍️ AI Writer

Create original content with:

- Tone control (formal, neutral, casual)
- Format options (plain-text, markdown)
- Length adjustment (short, medium, long)
- Integrated **Proofreader API** for grammar checking
- Integrated **Rewriter API** for text transformation

### 📚 Summary Library

Save, organize, and search your summaries with full-text search and bookmark management.

### 🎯 Additional Features

- **Context Menu Integration** - Right-click text to ask AI about it or generate content
- **Dark Mode** - Beautiful UI that adapts to your system theme
- **🔒 100% Private** - All AI processing happens on-device using Gemini Nano
- **⚡ Offline Capable** - Works without internet connection
- **💰 Zero Cost** - No API keys, no server costs, no quotas

## 🚀 Installation

### Prerequisites

- **Chrome 128+** (recommended Chrome 140+ for all features)
- **22 GB free disk space** (for AI models)
- **Enable Chrome AI flags** - [Watch Setup Tutorial](https://www.youtube.com/watch?v=finN5PfJyCg)

  Required flags:

  ```
  chrome://flags/#optimization-guide-on-device-model → Enabled
  chrome://flags/#prompt-api-for-gemini-nano → Enabled
  chrome://flags/#summarization-api-for-gemini-nano → Enabled
  chrome://flags/#writer-api-for-gemini-nano → Enabled
  chrome://flags/#rewriter-api-for-gemini-nano → Enabled
  ```

  **After enabling flags**: Restart Chrome completely (quit and reopen)

### Install from Source

1. Clone this repository:

   ```bash
   git clone https://github.com/0xtanzim/contentchat-ai.git
   cd contentchat-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🛠️ Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

## 🏗️ Tech Stack

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Styling with latest features
- **Zustand** - Lightweight state management
- **Chrome Built-in AI APIs** - On-device AI processing
- **Vite** - Fast build tool

## 📦 Project Structure

```
contentchat-ai/
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content scripts
│   ├── sidepanel/        # Main UI components
│   ├── lib/              # Utilities & AI wrappers
│   ├── components/       # Reusable UI components
│   └── types/            # TypeScript definitions
├── public/               # Static assets
├── docs/                 # Documentation
│   └── ARCHITECTURE.md   # 📐 Detailed architecture documentation
└── tests/                # Test files
```

## 📐 Architecture

ContentChat AI follows a **modular, layered architecture** with clear separation of concerns:

- **Chrome Extension Layer**: Manifest V3 with background service worker, content scripts, and side panel UI
- **Frontend Layer**: React 19 components with lazy loading and optimized rendering
- **State Management**: Zustand stores for conversations, summaries, and app state
- **Service Layer**: Business logic for AI operations (chat, summary, writer, rewriter, proofreader)
- **Data Layer**: IndexedDB persistence with 30-day retention policy
- **Chrome AI Layer**: Wrapper for Chrome Built-in AI APIs with error handling

**📚 For detailed architecture documentation with diagrams, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

Key architectural highlights:

- ✅ **Privacy-First**: Zero external API calls, all processing on-device
- ✅ **Type-Safe**: Strict TypeScript with comprehensive type guards
- ✅ **Performance-Optimized**: Code splitting, memoization, lazy loading
- ✅ **Modular Design**: Feature-based organization with clear boundaries
- ✅ **Data Isolation**: Separate IndexedDB databases prevent data mixing
- ✅ **Design Patterns**: Factory, Repository, Observer, Strategy, Adapter patterns

## 🎯 Chrome Built-in AI APIs Used

This extension showcases **5 Chrome Built-in AI APIs**, all running on-device with Gemini Nano:

### 1. 📄 Summarizer API

- Generate key-points, TL;DR, teasers, or headlines
- Streaming support for real-time updates
- Context-aware summarization

### 2. 💭 Prompt API (LanguageModel)

- AI chat with page context
- Personal AI conversations
- Streaming responses
- Multi-turn dialogue support

### 3. ✍️ Writer API

- Original content generation
- Tone control (formal, neutral, casual)
- Format options (plain-text, markdown)
- Length adjustment (short, medium, long)

### 4. 🔄 Rewriter API

- Text transformation
- Tone modification
- Format conversion
- Length adjustment

### 5. ✅ Proofreader API

- Grammar checking
- Spelling correction
- Punctuation fixes
- Integrated with Writer for error-free content

---

## 🌟 Why ContentChat AI?

### Privacy First 🔒

All AI processing happens **on your device** using Gemini Nano. Zero data sent to servers, complete privacy guaranteed.

### Cost Efficient 💰

No API keys, no server costs, no usage quotas. Build freely without worrying about expenses.

### Network Resilient ✅

Works **offline** with consistent performance. Perfect for users on unstable connections.

### Hyper-Personalized 🎯

Deliver personalized experiences with the guarantee that user input never leaves the device.

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📸 Screenshots

### Summary View

Generate instant summaries with multiple formats (key-points, TL;DR, headline, teaser).

### Chat View

Ask AI questions about the current page or have general conversations.

### Writer View

Create content with AI assistance, integrated proofreader, and rewriter.

### Library View

Organize and search your saved summaries.

---

## 🎓 For Judges & Testers

### Quick Start Guide

1. **Watch the setup tutorial**: [How to Enable Chrome's Built-in AI](https://www.youtube.com/watch?v=finN5PfJyCg)
2. **Clone and build** (5 minutes):
   ```bash
   git clone https://github.com/0xTanzim/contentchat-ai.git
   cd contentchat-ai
   npm install
   npm run build
   ```
3. **Load extension** in Chrome:

   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select `dist` folder

4. **Test features**:
   - Open any article/webpage
   - Click extension icon → Opens side panel
   - Try Summary, Chat, Writer tabs
   - Right-click text → See context menu options

### Testing Checklist

- [ ] Summary generation (key-points, TL;DR, headline)
- [ ] Chat with page context
- [ ] AI Writer with proofreader/rewriter
- [ ] Summary library and search
- [ ] Context menu integration
- [ ] Dark/light mode toggle
- [ ] Offline functionality

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Developer

**Tanzim Hossain** (@0xtanzim)

- 🌐 GitHub: [@0xtanzim](https://github.com/0xtanzim)
- 💼 LinkedIn: [0xtanzim](https://www.linkedin.com/in/0xtanzim)
- 🐦 Twitter/X: [@0xtanzim](https://twitter.com/0xtanzim)
- 📧 Email: tanzimhossain2@gmail.com

---

## 🙏 Acknowledgments

Built for the **Google Chrome Built-in AI Challenge 2025** 🏆

Special thanks to:

- The **Chrome Team** for making on-device AI accessible to developers
- The **Chrome Built-in AI APIs** that power this extension
- **Gemini Nano** - the on-device AI model that makes privacy-first AI possible

---

## 🔗 Resources

### Project Links

- **Demo Video**: https://youtu.be/ridT8FSLx0k
- **Setup Tutorial**: https://www.youtube.com/watch?v=finN5PfJyCg
- **GitHub Repository**: https://github.com/0xtanzim/contentchat-ai
- **Issue Tracker**: https://github.com/0xtanzim/contentchat-ai/issues
- **Devpost**: https://googlechromeai2025.devpost.com/

### Chrome Built-in AI Documentation

- [Chrome Built-in AI Overview](https://developer.chrome.com/docs/ai/built-in)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Writer API](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
- [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)

### Project Documentation

- [📐 Architecture Documentation](./docs/ARCHITECTURE.md) - Comprehensive system architecture with diagrams
- [📖 Understanding Chrome Built-in AI](./docs/01-UNDERSTANDING-CHROME-BUILT-IN-AI.md) - Developer guide

---

<div align="center">

**Made with ❤️ using Chrome Built-in AI**

⭐ **Star this repo** if you find it helpful!

[![Chrome Built-in AI Challenge 2025](https://img.shields.io/badge/Google%20Chrome-Built--in%20AI%20Challenge%202025-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://googlechromeai2025.devpost.com/)

</div>
