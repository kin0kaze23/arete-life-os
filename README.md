<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cuj7akXL5dISmQasbU6DwZz0E_nhigma

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (used by the server-side `/api/gemini` proxy; do not commit this file)
3. Run the app:
   `npm run dev`

On first launch, set a passphrase to encrypt local data. This passphrase is not recoverable.
