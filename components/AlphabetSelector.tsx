
import React from 'react';

interface AlphabetSelectorProps {
    alphabet: string[];
    selectedLetter: string | null;
    onSelect: (letter: string) => void;
    disabled: boolean;
}

export const AlphabetSelector: React.FC<AlphabetSelectorProps> = ({
    alphabet,
    selectedLetter,
    onSelect,
    disabled,
}) => {
    return (
        <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-2 justify-center">
            {alphabet.map((letter) => {
                const isSelected = letter === selectedLetter;
                return (
                    <button
                        key={letter}
                        onClick={() => onSelect(letter)}
                        disabled={disabled}
                        className={`
                            flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-xl 
                            transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50
                            ${
                                isSelected
                                    ? 'bg-purple-600 text-white scale-110 shadow-lg ring-purple-400'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900 hover:scale-105'
                            }
                            ${
                                disabled && !isSelected
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                            }
                        `}
                    >
                        {letter}
                    </button>
                );
            })}
        </div>
    );
};
