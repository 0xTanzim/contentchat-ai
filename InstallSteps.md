# **Setting Up and Testing Gemini Nano (Chrome Built-in AI)**

This guide explains how to enable, download, and test the **Gemini Nano** on-device AI model in Google Chrome. Follow these steps carefully to ensure your environment is ready.

[![video tutorial](https://img.youtube.com/vi/finN5PfJyCg/hqdefault.jpg)](https://youtu.be/finN5PfJyCg?si=ipH-ZFchKFDtWVQP)

---

## **1. Check Chrome Version**

Make sure your Chrome browser version is **141 or higher**.

You can check it by visiting:

```
chrome://settings/help
```

---

## **2. Test Model Availability**

Open the browser console (Ctrl + Shift + J) and run:

```js
await LanguageModel.availability();
```

If the result is `'downloadable'`, it means the model can be downloaded but is not yet installed.

---

## **3. Enable Required Chrome Flags**

Open the following page in Chrome:

```
chrome://flags
```

Then **search and enable** these flags:

- `Gemini Nano`
- `prompt-api-for-gemini-nano`
- `optimization-guide-on-device-model`

After enabling all three, **relaunch Chrome**.

---

## **4. Check On-Device Internals**

Go to:

```
chrome://on-device-internals
```

You will see sections like **Tools**, **Event Logs**, and **Model Status**.

- Open the **Model Status** tab.
- Scroll to the **Feature Adaptations** section.
- Make sure all options are set to **true**. (By default, they may be false.)

---

## **5. Download the Model**

Now visit:

```
chrome://components
```

Find the section named **Optimization Guide On Device Model**.

- It may initially show version `0.0.0.0` with a **Download** button.
- Wait for the model to download — it can take time.
- According to official documentation, it requires **2.2–3 GB download size** and about **22 GB of free disk space**.

Once the download completes, the version number will change to something like:

```
20250924.1.0
```

---

## **6. Recheck Model Availability**

Run this command again in the console:

```js
await LanguageModel.availability();
```

If the result is now `'available'`, the Gemini Nano model is ready to use.

If it’s **still not available**, try initializing it manually:

```js
await LanguageModel.create();
```

This triggers the AI model setup. You can recheck the model status again in:

```
chrome://components
```

---

## **7. Run a Test Prompt**

Once the model is available, you can test it with this sample code on the browser console:

```js
const sessionOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const session = await LanguageModel.create(sessionOptions);
const result = await session.prompt(
  'Write me a short summary about SOLID principles.'
);
console.log(result);
```

If everything is set up correctly, you’ll see an AI-generated response printed in the console.

---

## **8. Summary**

**In short:**

1. Update Chrome to v140+.
2. Enable Gemini Nano and related flags.
3. Check on-device internals and feature adaptations.
4. Wait for the model to download from `chrome://components`.
5. Confirm availability via `LanguageModel.availability()`.
6. Run a test prompt to verify AI functionality.

You’ve successfully set up Gemini Nano for on-device AI development!
