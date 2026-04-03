import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {publishableKey ? (
        <ClerkProvider publishableKey={publishableKey}>
          <App />
        </ClerkProvider>
      ) : (
        <div className="min-h-screen bg-[#02040a] text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold text-rose-400 mb-2">Clerk Keys Missing</h1>
          <p className="text-white/60 text-sm">
            Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.
          </p>
        </div>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
