import React from 'react';

// Mock user object for E2E tests
const mockUser = {
  id: 'user-e2e',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'Test',
  lastName: 'User',
  imageUrl: '',
  username: 'testuser',
  primaryEmailAddress: { emailAddress: 'test@example.com' },
} as any;

// Mock hook that returns signed-in state
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'user-e2e',
  sessionId: 'session-e2e',
  actor: null,
  getUser: async () => mockUser,
  signOut: async () => {},
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: mockUser,
});

// SignedIn component - always shows children in E2E mode
export const SignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// SignedOut component - never shows children in E2E mode
export const SignedOut: React.FC<{ children: React.ReactNode }> = () => <></>;

// UserButton mock - renders a placeholder
export const UserButton: React.FC<any> = () => (
  <div data-testid="user-button" className="w-10 h-10 rounded-xl bg-slate-800" />
);

// SignIn mock - never renders in E2E mode
export const SignIn: React.FC<any> = () => null;

// ClerkProvider mock - just renders children directly
export const ClerkProvider: React.FC<{ children: React.ReactNode; publishableKey?: string }> = ({
  children,
}) => <React.Fragment>{children}</React.Fragment>;
