
import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  subLabel?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, subLabel }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      {label && 
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {subLabel && <span className="text-xs text-gray-500">{subLabel}</span>}
        </div>
      }
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
