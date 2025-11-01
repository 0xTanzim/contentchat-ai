# Understanding Chrome Built-in AI & Gemini Nano

## 📌 Executive Summary

**YES, the hackathon requires you to use Chrome's Built-in AI (Gemini Nano)!**

Chrome provides **LOCAL, on-device AI models** through browser APIs. This means AI runs **directly in the browser** without sending data to the cloud - providing privacy, speed, and offline capabilities.

---

## 🎯 What You Saw in Chrome Flags

When you navigate to `chrome://flags`, you see these feature flags:

```
✅ Prompt API for Gemini Nano with Multimodal Input
✅ Summarization API for Gemini Nano
✅ Writer API for Gemini Nano
✅ Rewriter API for Gemini Nano
```

### What This Means:

These flags **enable Chrome's Built-in AI APIs** that use **Gemini Nano** - Google's lightweight AI model that runs **locally on your computer**.

---

## 🧠 Understanding Gemini Nano

### What is Gemini Nano?

- **Small language model** designed to run on-device
- **Part of Google's Gemini family** (Gemini Pro → Gemini Flash → **Gemini Nano**)
- **Optimized for local execution** on laptops/desktops
- **Downloaded once** and stored in Chrome (~22GB storage required)

### Gemini Nano Specifications (Chrome 140+):

| Feature          | Details                                         |
| ---------------- | ----------------------------------------------- |
| **Languages**    | English (`en`), Spanish (`es`), Japanese (`ja`) |
| **Input Types**  | Text, Image, Audio (multimodal)                 |
| **Output Types** | Text only                                       |
| **Model Size**   | ~22 GB (varies with updates)                    |
| **Processing**   | CPU (16GB RAM + 4 cores) OR GPU (>4GB VRAM)     |

---

## 📊 What The Warning Means

When you run:

```javascript
await LanguageModel.availability();
```

And see:

```
No output language was specified in a LanguageModel API request.
An output language should be specified to ensure optimal output quality
and properly attest to output safety. Please specify a supported output
language code: [en, es, ja]
'downloadable'
```

### Explanation:

1. **Warning**: You should specify an output language for better quality
2. **`'downloadable'`**: Gemini Nano model is **NOT yet downloaded** but **can be downloaded**

### Possible Statuses:

| Status           | Meaning                        | Action Required                        |
| ---------------- | ------------------------------ | -------------------------------------- |
| `'unavailable'`  | Device doesn't support AI APIs | Check hardware requirements            |
| `'downloadable'` | Model can be downloaded        | Trigger download with user interaction |
| `'downloading'`  | Model is being downloaded      | Show progress to user                  |
| `'available'`    | Model is ready to use          | Start using AI APIs                    |

---

## 🔧 How Chrome Built-in AI Works

### Architecture:

```
┌─────────────────────────────────────────┐
│   Your Chrome Extension / Web App       │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  Chrome Built-in AI APIs        │  │
│   │  - Prompt API                    │  │
│   │  - Summarizer API                │  │
│   │  - Writer API                    │  │
│   │  - Rewriter API                  │  │
│   │  - Translator API                │  │
│   │  - Language Detector API         │  │
│   └──────────────┬──────────────────┘  │
│                  │                      │
└──────────────────┼──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Gemini Nano Model   │
        │  (Downloaded locally) │
        │  ~22GB on disk        │
        └──────────┬────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Hardware (GPU/CPU)   │
        │  Local Processing     │
        └───────────────────────┘
```

### Key Points:
```
✅ **All processing happens LOCAL** - No cloud required
✅ **Data NEVER leaves the device** - Complete privacy
✅ **Works OFFLINE** - No internet needed after download
✅ **No API keys required** - Built into Chrome
✅ **No costs/quotas** - Free to use unlimited
```
---

## 📦 Available APIs

### 1. **Prompt API** (Most Powerful)

- **Status**: Stable in Chrome Extensions (Chrome 138+)
- **Purpose**: General-purpose AI - send any text prompt
- **Multimodal**: ⚠️ Image + Audio input (Origin Trial only)
- **Use Cases**:
  - Custom chatbots
  - Content analysis
  - Smart suggestions
  - Any AI task not covered by specialized APIs

### 2. **Summarizer API**

- **Status**: ✅ Stable (Chrome 138+)
- **Purpose**: Condense long text into summaries
- **Types**: `key-points`, `tldr`, `teaser`, `headline`
- **Use Cases**:
  - Article summaries
  - Meeting notes condensation
  - Review aggregation

### 3. **Writer API**

- **Status**: 🧪 Origin Trial
- **Purpose**: Generate NEW content
- **Use Cases**:
  - Draft emails
  - Create blog posts
  - Write product descriptions

### 4. **Rewriter API**

- **Status**: 🧪 Origin Trial
- **Purpose**: Improve EXISTING text
- **Options**: Change tone, length, formality
- **Use Cases**:
  - Make text more professional
  - Simplify complex writing
  - Adjust tone for audience

### 5. **Translator API**

- **Status**: ✅ Stable (Chrome 138+)
- **Purpose**: Translate text between languages
- **Use Cases**:
  - Real-time translation
  - Multilingual support
  - Localization

### 6. **Language Detector API**

- **Status**: ✅ Stable (Chrome 138+)
- **Purpose**: Identify language of text
- **Use Cases**:
  - Auto-detect input language
  - Route to appropriate translator

### 7. **Proofreader API**

- **Status**: 🧪 Origin Trial
- **Purpose**: Grammar and spelling corrections
- **Use Cases**:
  - Text editing tools
  - Writing assistance
  - Comment cleanup

---

## 🎮 Origin Trial vs Stable

### Stable APIs (No registration needed):

- ✅ Translator API
- ✅ Language Detector API
- ✅ Summarizer API
- ✅ **Prompt API** (Chrome Extensions only)

### Origin Trial APIs (Registration required):

- 🧪 Writer API
- 🧪 Rewriter API
- 🧪 Proofreader API
- 🧪 Prompt API (Web apps)
- 🧪 Prompt API Multimodal (Extensions + Web)

### What is Origin Trial?

- **Experimental features** available to all developers
- **Requires registration** at https://developer.chrome.com/docs/web-platform/origin-trials
- **Time-limited** testing period
- **May have usage limits**
- **Can change** based on feedback

---

## 🏆 Hackathon Requirements Clarification

### ✅ What the Hackathon REQUIRES:

> "Entrants must develop a new web application or Chrome Extension that uses **one or more APIs to interact with Chrome's built-in AI models, such as Gemini Nano**."

### Translation:

1. ✅ You **MUST use Chrome's built-in AI APIs**
2. ✅ These APIs **USE Gemini Nano** (the model)
3. ✅ You can use **ANY combination of the APIs listed**
4. ✅ You **DON'T need to manage Gemini Nano yourself** - just use the APIs

### What You DON'T Need:
```
❌ Download Gemini Nano manually
❌ Use Gemini API from Google AI Studio
❌ Use Firebase AI Logic (unless doing hybrid approach)
❌ Pay for API access
❌ Manage model updates
```
---

## 🚀 Quick Start Example

### Correct Approach (With Output Language):

```javascript
// 1. Check availability
const availability = await LanguageModel.availability();

if (availability !== 'available') {
  console.log('Model needs to be downloaded');
}

// 2. Create session WITH output language (fixes warning!)
const session = await LanguageModel.create({
  expectedOutputs: [
    { type: 'text', languages: ['en'] }, // Specify output language!
  ],
});

// 3. Use the model
const result = await session.prompt(
  'Explain quantum computing in simple terms'
);
console.log(result);
```

### Why This Fixes Your Warning:

Your code was missing `expectedOutputs` specification. Chrome wants to know what language you expect the output in for:

- **Better quality** responses
- **Safety attestation** (content moderation)
- **Proper resource allocation**

---

## 💡 Key Takeaways

1. ✅ **Chrome Built-in AI = Gemini Nano** running locally
2. ✅ **Feature flags enable the APIs**, not the model itself
3. ✅ **`'downloadable'` means** you need to trigger download
4. ✅ **Hackathon requires** using these APIs
5. ✅ **Specify output language** to avoid warnings
6. ✅ **Chrome Extensions have best support** (Prompt API stable)
7. ✅ **All data processing is LOCAL** - complete privacy

---

## 🎓 Next Steps

1. **Read**: `02-HACKATHON-RULES-ANALYSIS.md` - Understand submission requirements
2. **Read**: `03-SETUP-GUIDE.md` - Configure Chrome for development
3. **Read**: `04-API-REFERENCE.md` - Deep dive into each API
4. **Read**: `05-PROJECT-IDEAS.md` - Winning project concepts

---

## 📚 Official Resources

- **Chrome AI Docs**: https://developer.chrome.com/docs/ai/built-in
- **API Status**: https://developer.chrome.com/docs/ai/built-in-apis
- **Join EPP**: https://developer.chrome.com/docs/ai/join-epp
- **Hackathon Rules**: https://googlechromeai2025.devpost.com/rules

---

**Next Document**: [Hackathon Rules Analysis →](./02-HACKATHON-RULES-ANALYSIS.md)
