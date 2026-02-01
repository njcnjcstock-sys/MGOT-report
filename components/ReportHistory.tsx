
import React from 'react';
import { ReportHistoryItem } from '../types';
import { HistoryIcon, TrashIcon } from './icons';

interface ReportHistoryProps {
  history: ReportHistoryItem[];
  onViewReport: (reportContent: string) => void;
  onClearHistory: () => void;
  className?: string;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ history, onViewReport, onClearHistory, className }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className={`mt-8 ${className || ''}`}>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <HistoryIcon className="w-6 h-6" />
          Report History
        </h2>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          aria-label="Clear all report history"
        >
          <TrashIcon className="w-4 h-4" />
          Clear History
        </button>
      </div>
      <p className="text-xs text-gray-500 italic mb-3">
        Viewing a past report does not fetch live data. Data reflects the state at the time of generation.
      </p>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <ul className="divide-y divide-gray-200">
          {history.map((item) => (
            <li key={item.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="font-semibold text-gray-800">{item.companyName} ({item.ticker})</p>
                <p className="text-sm text-gray-500">Generated on: {item.date}</p>
              </div>
              <button
                onClick={() => onViewReport(item.reportContent)}
                className="bg-gray-100 text-gray-700 font-semibold py-1.5 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm whitespace-nowrap"
              >
                View Report
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportHistory;
