/**
 * AURA LIFE OS | DARK PREMIUM DESIGN SYSTEM
 * The source of truth for all aesthetic constants.
 */

export const TOKENS = {
  colors: {
    background: {
      void: '#02040a', // Primary page background
      deep: '#08090C', // Sidebars and drawers
      elevated: '#0D1117', // Bento cards and modals
      active: '#181b21', // Hover and active states
    },
    brand: {
      indigo: '#6366f1', // Primary action / system brand
      rose: '#f43f5e', // Risk / Danger / Urgency
      emerald: '#10b981', // Success / Health / Verification
      amber: '#f59e0b', // Warning / Insight / Calibration
      cyan: '#06b6d4', // Social / Relationships
    },
    text: {
      primary: '#e6edf3', // High contrast body
      secondary: '#8b949e', // Dimmed descriptions
      muted: '#484f58', // Small metadata / disabled
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(99, 102, 241, 0.4)',
    },
  },
  radius: {
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px (Inputs / Items)
    xl: '2rem', // 32px (Bento Sections)
    full: '3rem', // 48px (Primary View Panels)
  },
  blur: {
    standard: '40px',
    heavy: '80px',
  },
  animations: {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    pulse: 'neural-pulse 4s infinite ease-in-out',
  },
};

export default TOKENS;
