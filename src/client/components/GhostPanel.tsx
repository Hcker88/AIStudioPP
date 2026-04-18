import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export const GhostPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { syncState, user, decisionInsight } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 bg-gray-900 text-white w-80 h-96 overflow-y-auto z-50 opacity-90 text-xs">
      <h3 className="font-bold mb-2">Ghost Panel</h3>
      <div className="mb-2"><strong>Sync State:</strong> {syncState}</div>
      <div className="mb-2"><strong>User:</strong> {user ? user.email : 'Not logged in'}</div>
      <div className="mb-2"><strong>Decision Insight:</strong> {JSON.stringify(decisionInsight, null, 2)}</div>
    </div>
  );
};
