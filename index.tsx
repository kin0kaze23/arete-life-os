import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/app/ErrorBoundary';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isE2E = import.meta.env.VITE_E2E === '1';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// E2E mode: Use mock Clerk provider
if (isE2E) {
  import('@/core/ClerkMockProvider').then(({ ClerkProvider }) => {
    import('@/app/App').then(({ default: App }) => {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <ClerkProvider>
              <App />
            </ClerkProvider>
          </ErrorBoundary>
        </React.StrictMode>
      );
    });
  });
} else if (publishableKey) {
  // Production/Dev mode: Use real Clerk
  import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    import('@/app/App').then(({ default: App }) => {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <ClerkProvider publishableKey={publishableKey}>
              <App />
            </ClerkProvider>
          </ErrorBoundary>
        </React.StrictMode>
      );
    });
  });
} else {
  // Error: Missing Clerk key
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div className="min-h-screen bg-[#02040a] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold text-rose-400 mb-2">Clerk Keys Missing</h1>
      <p className="text-white/60 text-sm">
        Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.
      </p>
    </div>
  );
}
