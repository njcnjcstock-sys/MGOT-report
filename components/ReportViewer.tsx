
import React, { useState } from 'react';
import { ReportPageData } from '../types';
import ReportPage from './ReportPage';

interface ReportViewerProps {
    pages: ReportPageData[];
}

const ReportViewer: React.FC<ReportViewerProps> = ({ pages }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
    };

    return (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">{pages[currentPage]?.title || 'Report'}</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">
                        Page {currentPage + 1} of {pages.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 0}
                            className="px-3 py-1 bg-white border border-gray-300 text-sm font-semibold rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Prev
                        </button>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === pages.length - 1}
                            className="px-3 py-1 bg-white border border-gray-300 text-sm font-semibold rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-6 sm:p-8">
                {pages[currentPage] && <ReportPage content={pages[currentPage].content} />}
            </div>
        </div>
    );
};

export default ReportViewer;
