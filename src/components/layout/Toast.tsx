import React from 'react';
import { useFibroStore } from '../../store/useFibroStore';

export const Toast: React.FC = () => {
  const { toastMessage } = useFibroStore();

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-5 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl transform transition-all duration-300 text-xs font-semibold flex items-center space-x-2.5 pointer-events-none ${
        toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-rosebrand-500 text-white flex items-center justify-center text-xs">
        ✓
      </span>
      <span>{toastMessage || ''}</span>
    </div>
  );
};
