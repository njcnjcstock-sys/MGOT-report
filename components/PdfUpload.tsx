
import React, { useState, useCallback } from 'react';
import { extractTickersFromPdf } from '../services/geminiService';
import { UploadIcon } from './icons';

interface PdfUploadProps {
  onTickersExtracted: (tickers: string) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string | null) => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onTickersExtracted, setIsLoading, setLoadingMessage, setError }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      if (selectedFile) {
        setError('Please select a valid PDF file.');
      }
    }
  };

  const handleExtract = useCallback(async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Analyzing PDF and extracting tickers...');
    setError(null);

    try {
      const tickers = await extractTickersFromPdf(file);
      if (!tickers) {
        setError("No tickers were found in the provided PDF. Please check the file and try again.");
      } else {
        onTickersExtracted(tickers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during PDF processing.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      // Clear the file input visually by resetting the form it's in, or by keying the component
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      setFile(null); // Reset file state
    }
  }, [file, onTickersExtracted, setIsLoading, setLoadingMessage, setError]);

  return (
    <div className="flex flex-col items-center gap-4">
      <label htmlFor="pdf-upload" className="w-full flex flex-col items-center justify-center px-6 py-10 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
        <UploadIcon className="w-10 h-10 text-gray-400 mb-3" />
        <span className="text-gray-600 font-medium text-center">
          {file ? file.name : 'Choose a PDF file or drop it here'}
        </span>
        <p className="text-sm text-gray-500 mt-1">The PDF should contain a list or table of stocks</p>
        <input id="pdf-upload" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
      </label>
      
      <button
        onClick={handleExtract}
        className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
        disabled={!file}
      >
        Extract Tickers
      </button>
    </div>
  );
};

export default PdfUpload;
