# ContentChat AI

> Privacy-first AI reading assistant powered by Chrome Built-in AI

A Chrome Extension that brings intelligent content interaction directly to your browser using on-device AI. No data sent to servers, no API keys required - everything runs locally using Chrome's Gemini Nano.

## ✨ Features

- **🤖 Smart Summarization** - Generate key-points, TL;DR, teasers, or headlines from any webpage
- **💬 Intelligent Chat** - Ask questions about page content or have personal conversations with AI
- **✍️ Grammar Checker** - Fix spelling, grammar, and punctuation errors instantly
- **🔄 Text Rewriter** - Adjust tone (formal/casual), format (markdown/plain), and length
- **🎯 Context Menu Integration** - Right-click text to ask AI about it
- **📚 History & Library** - Save and organize your summaries
- **🌙 Dark Mode** - Beautiful UI that adapts to your system theme
- **🔒 100% Private** - All processing happens on your device

## 🚀 Installation

### Prerequisites

- Chrome/Edge 128+ (with AI enabled)
- Enable Chrome AI flags:
  ```
  chrome://flags/#optimization-guide-on-device-model
  chrome://flags/#prompt-api-for-gemini-nano
  chrome://flags/#summarization-api-for-gemini-nano
  ```

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
└── tests/                # Test files
```

## 🎯 Chrome Built-in AI APIs Used

- **Summarizer API** - Text summarization
- **Prompt API (LanguageModel)** - Chat functionality
- **Proofreader API** - Grammar checking
- **Rewriter API** - Text transformation
- **Language Detector API** - Language detection (ready)
- **Translator API** - Translation (ready for v2.0)

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

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👨‍💻 Developer

**Tanzim Hossain** (@0xtanzim)

- GitHub: [@0xtanzim](https://github.com/0xtanzim)
- LinkedIn: [0xtanzim](https://www.linkedin.com/in/0xtanzim)
- Twitter/X: [@0xtanzim](https://twitter.com/0xtanzim)
- Email: tanzimhossain2@gmail.com

## 🙏 Acknowledgments

Built for the **Google Chrome Built-in AI Challenge 2025**

Special thanks to the Chrome team for making on-device AI accessible to developers!

## 🔗 Links

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Project Repository](https://github.com/0xtanzim/contentchat-ai)
- [Issue Tracker](https://github.com/0xtanzim/contentchat-ai/issues)

---

Made with ❤️ using Chrome Built-in AI
