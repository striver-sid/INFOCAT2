import { useState, useEffect, useCallback } from 'react';
import { fetchSystemHealth } from '../api/health.api.js';

export function useSystemHealth(pollIntervalMs = 15000) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const data = await fetchSystemHealth();
      const roundTripMs = Math.round(performance.now() - start);

      if (data && data.success && data.status === 'online') {
        setStatus('online');
        setHealthData({ ...data, roundTripMs });
        setError(null);
      } else {
        setStatus('offline');
        setHealthData({ ...data, roundTripMs });
        setError(data?.message || 'Backend reported degraded or non-operational status');
      }
    } catch (err) {
      setStatus('offline');
      setHealthData(null);
      setError(err.message || 'Cannot reach backend server');
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (pollIntervalMs > 0) {
      const timer = setInterval(checkHealth, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [checkHealth, pollIntervalMs]);

  return {
    status,
    healthData,
    error,
    lastChecked,
    isLoading,
    refresh: checkHealth,
  };
}

export default useSystemHealth;
