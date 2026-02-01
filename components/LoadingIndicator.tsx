
import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="text-center mt-12 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-indigo-600 border-gray-200 border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 font-medium text-lg whitespace-pre-wrap">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
