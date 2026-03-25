module.exports = {
  content: ['./index.html', './**/*.{ts,tsx}'],

  theme: {
    extend: {
      backgroundColor: {
        primary: 'var(--bg-primary)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      colors: {
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
      },
      backgroundImage: {
        'status-critical': 'var(--status-critical)',
        'status-at-risk': 'var(--status-at-risk)',
        'status-healthy': 'var(--status-healthy)',
        'status-thriving': 'var(--status-thriving)',
      },
    },
  },
  plugins: [],
};
