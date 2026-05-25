import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // Instant scroll to prevent visual flicker
    });
    
    // Also clear any scroll in the document element or body
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
