
import React, { useEffect, useState } from 'react';

interface LoaderProps {
    text: string;
    progress?: number;
    estimatedTime?: number;
}

const Loader: React.FC<LoaderProps> = ({ text, progress, estimatedTime }) => {
    const [timeLeft, setTimeLeft] = useState(estimatedTime || 0);

    useEffect(() => {
        if (estimatedTime === undefined) return;
        setTimeLeft(estimatedTime);

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [estimatedTime]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <div className="mt-6 flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
            <div className="w-8 h-8 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700">{text}</p>
            {progress !== undefined && (
                <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            )}
            {estimatedTime !== undefined && timeLeft > 0 && (
                 <p className="mt-2 text-sm text-gray-500">
                    Estimated time remaining: {formatTime(timeLeft)}
                </p>
            )}
        </div>
    );
};

export default Loader;
