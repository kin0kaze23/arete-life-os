import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const CheckmarkAnimation: React.FC = () => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    };

    sequence();
  }, [controls]);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={controls}
    >
      <motion.path d="M4 12l5 5L20 6" style={{ strokeDasharray: '1 1', strokeDashoffset: '1' }} />
    </motion.svg>
  );
};

export const ConfettiAnimation: React.FC = () => {
  const colors = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722',
  ];

  return (
    <div style={{ position: 'relative', width: '50px', height: '50px' }}>
      {Array.from({ length: 20 }).map((_, i) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomSize = Math.random() * 8 + 4; // Random size between 4px and 12px
        const randomDelay = Math.random() * 2; // Random delay up to 2s

        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top: `${randomY}%`,
              left: `${randomX}%`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
              backgroundColor: randomColor,
              borderRadius: '50%',
            }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{
              opacity: 1,
              y: -100,
              scale: 1,
              transition: { duration: 1, delay: randomDelay, ease: 'easeOut' },
            }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          />
        );
      })}
    </div>
  );
};

export const ProgressBarAnimation: React.FC<{ progress: number }> = ({ progress }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 0.5, ease: 'easeOut' },
    });
  }, [progress, controls]);

  return (
    <div className="bg-gray-700 rounded-full h-2.5 mb-4">
      <motion.div
        className="bg-accent-primary h-2.5 rounded-full"
        style={{ width: '0%' }}
        animate={controls}
      />
    </div>
  );
};
