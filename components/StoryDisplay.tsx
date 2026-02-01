
import React from 'react';
import type { StoryResult } from '../types';

interface StoryDisplayProps {
    storyResult: StoryResult | null;
    isLoading: boolean;
    error: string | null;
    selectedLetter: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-600 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-purple-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Weaving a whimsical tale...</p>
    </div>
);

const WelcomeMessage: React.FC = () => (
     <div className="text-center text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.388l-3.866 2.158a1 1 0 00-.268 0L7.5 6.388M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-semibold">Ready for an Adventure?</h2>
        <p className="mt-2">Select a letter from above to begin your story.</p>
    </div>
);


export const StoryDisplay: React.FC<StoryDisplayProps> = ({ storyResult, isLoading, error, selectedLetter }) => {
    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="text-center text-red-500 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold mt-4">Oh No!</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (storyResult) {
        return (
            <div className="w-full animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                    <img 
                        src={storyResult.imageUrl} 
                        alt={`Illustration for the story about the letter ${selectedLetter}`}
                        className="w-full h-full object-cover" 
                    />
                </div>
                <div className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    <p>{storyResult.story}</p>
                </div>
            </div>
        );
    }
    
    return <WelcomeMessage />;
};
