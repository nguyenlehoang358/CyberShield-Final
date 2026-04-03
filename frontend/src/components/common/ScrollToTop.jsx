import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of window on pathname change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use instant to avoid weird jumping during transition
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
