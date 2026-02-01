
import React from 'react';
import { SearchIcon } from './icons';

interface TickerInputProps {
  ticker: string;
  setTicker: (ticker: string) => void;
  onVerify: () => void;
  isLoading: boolean;
}

const TickerInput: React.FC<TickerInputProps> = ({ ticker, setTicker, onVerify, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onVerify();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="e.g., AAPL, 700.HK, D05.SI, TOPGLOV.KL"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
          disabled={isLoading}
        />
      </div>
      <button
        onClick={onVerify}
        className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
        disabled={isLoading}
      >
        {isLoading ? 'Verifying...' : 'Generate Report(s)'}
      </button>
    </div>
  );
};

export default TickerInput;
