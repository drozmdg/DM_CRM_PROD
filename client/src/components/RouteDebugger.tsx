import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function RouteDebugger({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  useEffect(() => {
    console.log('🚀 Route changed to:', location);
    console.log('🎯 Current pathname:', window.location.pathname);
    console.log('📍 Window location:', window.location.href);
  }, [location]);
  
  return <>{children}</>;
}

export default RouteDebugger;