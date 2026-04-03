import React from 'react';

export const BackgroundAura: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#02040a] pointer-events-none z-[-1] overflow-hidden">
      {/* 
        A very subtle mesh/noise overlay to give a premium "expensive" feeling. 
        Note: Using a CSS radial gradient as a noise texture proxy.
      */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Deep Central Radial Gradient for Focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

      {/* Main Dimension Glows - Fixed to Viewport for Zero-Shift Consistency */}

      {/* Health (Green) - Top Left */}
      <div className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-[var(--dim-health)] opacity-[0.06] rounded-full blur-[180px]" />

      {/* Relationships (Purple) - Bottom Right */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--dim-relationships)] opacity-[0.07] rounded-full blur-[160px]" />

      {/* Spiritual (Amber) - Center/Left Offset */}
      <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-[var(--dim-spiritual)] opacity-[0.05] rounded-full blur-[120px]" />

      {/* Finance (Blue) - Subtle Bottom Left */}
      <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-[var(--dim-finance)] opacity-[0.04] rounded-full blur-[100px]" />
    </div>
  );
};
