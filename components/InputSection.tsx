import React from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface InputSectionProps {
    userInput: string;
    setUserInput: (value: string) => void;
    onVerify: () => void;
    onGenerate: () => void;
    appState: 'initial' | 'verifying' | 'verified' | 'generating' | 'complete' | 'error';
}

const InputSection: React.FC<InputSectionProps> = ({ userInput, setUserInput, onVerify, onGenerate, appState }) => {
    const isVerifyDisabled = appState === 'verifying' || appState === 'generating';
    const isGenerateDisabled = appState !== 'verified';

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Enter Company Name or Ticker</h2>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="e.g., AAPL, Apple Inc., or D05.SI (SGX)"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    disabled={isVerifyDisabled}
                />
                <button
                    onClick={onVerify}
                    disabled={isVerifyDisabled}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-300 shadow-sm"
                >
                    <SearchIcon />
                    Verify
                </button>
            </div>
            <div className="mt-2">
                <button
                    onClick={onGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition duration-300 shadow-sm"
                >
                    Generate Report
                </button>
            </div>
        </div>
    );
};

export default InputSection;