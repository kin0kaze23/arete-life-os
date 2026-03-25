import React from 'react';
import { useMediaQuery } from 'react-responsive';

export const Responsive = ({
  children,
  isMobile,
  isTablet,
  isDesktop,
  isTabletOrDesktop,
}: {
  children: React.ReactNode;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  isTabletOrDesktop?: boolean;
}) => {
  const mobileBreakpoint = 768;
  const tabletBreakpoint = 1024;

  const isMatchingMobile = useMediaQuery({ maxWidth: mobileBreakpoint - 1 });
  const isMatchingTablet = useMediaQuery({
    minWidth: mobileBreakpoint,
    maxWidth: tabletBreakpoint - 1,
  });
  const isMatchingDesktop = useMediaQuery({ minWidth: tabletBreakpoint });
  const isMatchingTabletOrDesktop = useMediaQuery({ minWidth: mobileBreakpoint });

  if (isMobile && isMatchingMobile) {
    return <>{children}</>;
  }
  if (isTablet && isMatchingTablet) {
    return <>{children}</>;
  }
  if (isDesktop && isMatchingDesktop) {
    return <>{children}</>;
  }
  if (isTabletOrDesktop && isMatchingTabletOrDesktop) {
    return <>{children}</>;
  }

  return null;
};
