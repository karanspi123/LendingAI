'use client';
import { useState, useEffect } from 'react';

export default function ApiStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/extract-text');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Status check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="animate-pulse">Checking API status...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Status</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status?.status === 'healthy' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status?.status || 'Unknown'}
        </div>
      </div>
      
      {status?.services?.services && (
        <div className="mt-4 space-y-2">
          {Object.entries(status.services.services).map(([service, healthy]) => (
            <div key={service} className="flex items-center justify-between text-sm">
              <span className="capitalize">{service.replace(/([A-Z])/g, ' $1')}</span>
              <span className={healthy ? 'text-green-600' : 'text-red-600'}>
                {healthy ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
