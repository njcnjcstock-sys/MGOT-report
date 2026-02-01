
import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Import VerificationResults from the central types file.
import { Company, ReportHistoryItem, CoverPageData, Theme, Report, VerificationResults } from './types';
// FIX: Import the new batch verification function.
import { verifyTickers, generateCoverPageDataFromReport, generateFullReportStream } from './services/geminiService';
import { generateReportPdf } from './services/pdfGenerator';
import TickerInput from './components/TickerInput';
import ReportDisplay from './components/ReportDisplay';
import ConfirmationModal from './components/ConfirmationModal';
import ReportHistory from './components/ReportHistory';
import { DocumentIcon, SparklesIcon, DownloadIcon, ClipboardIcon, TableIcon, PrintIcon } from './components/icons';
import CoverPage from './components/CoverPage';
import ProgressBar from './components/ProgressBar';
import LoadingIndicator from './components/LoadingIndicator';
import SectionSelectorModal from './components/SectionSelectorModal';
import ThemeSelector from './components/ThemeSelector';

// FIX: The VerificationResults interface has been moved to types.ts.

interface ProgressState {
  overall: number;
  currentReportProgress: number;
  totalReports: number;
  currentReportIndex: number;
  currentReportTicker: string;
  currentSection: string;
}

const ALL_REPORT_SECTIONS = [
    '1.0 TLDR',
    '2.0 Understanding the Company',
    '3.0 Main Products',
    '4.0 Significant Recent Events',
    '5.0 Stock Price Movements',
    '6.0 Macroeconomic Analysis',
    '7.0 Industry Outlook',
    '8.0 Peer Analysis',
    '9.0 Financial Analysis',
    '10.0 Valuation',
    '11.0 Catalyst & Risk',
    '12.0 Appendix',
    '13.0 Disclaimer',
];

const App: React.FC = () => {
  const [tickerInput, setTickerInput] = useState<string>('');
  const [companiesToConfirm, setCompaniesToConfirm] = useState<VerificationResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [copiedReportId, setCopiedReportId] = useState<number | null>(null);
  const [isPreparingDownload, setIsPreparingDownload] = useState<boolean>(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(ALL_REPORT_SECTIONS);
  const [isSectionSelectorOpen, setIsSectionSelectorOpen] = useState<boolean>(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('classic');
  const [activeReportTab, setActiveReportTab] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9); // Default zoom slightly smaller to fit
  const isGenerationCancelledRef = useRef<boolean>(false);
  
  const getFormattedDate = useCallback(() => {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
    });
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('equityReportHistory');
      if (storedHistory) {
        setReportHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load report history from localStorage", error);
      setReportHistory([]);
    }
  }, []);

  const saveHistory = (newHistory: ReportHistoryItem[]) => {
      setReportHistory(newHistory);
      localStorage.setItem('equityReportHistory', JSON.stringify(newHistory));
  };
  
  const parseReport = (rawContent: string): { coverPageData: CoverPageData | null; reportContent: string | null } => {
    const separator = '---END_COVER_PAGE_JSON---';
    const separatorIndex = rawContent.indexOf(separator);

    if (separatorIndex === -1) {
        return { coverPageData: null, reportContent: rawContent };
    }

    const jsonString = rawContent.substring(0, separatorIndex).trim().replace(/^```json\s*|```\s*$/g, '');
    const markdownContent = rawContent.substring(separatorIndex + separator.length).trim();
    
    try {
        const parsedJson = JSON.parse(jsonString);
        // Ensure backgroundImageUrl is explicitly null if not present or cleared
        parsedJson.backgroundImageUrl = null;
        return { coverPageData: parsedJson, reportContent: markdownContent };
    } catch (error) {
        return { coverPageData: null, reportContent: rawContent };
    }
  };

  const handleVerifyTickers = useCallback(async (tickersToVerify: string) => {
    if (!tickersToVerify) return;
    setError(null);
    setIsLoading(true);
    setReports([]);
    setActiveReportTab(null);
    setLoadingMessage('Verifying tickers... This may take a moment.');

    const tickers = tickersToVerify.split(',').map(t => t.trim()).filter(Boolean);
    if (tickers.length === 0) {
        setIsLoading(false);
        return;
    }
    const currentDate = getFormattedDate();

    try {
        const results = await verifyTickers(tickers, currentDate);
        setIsLoading(false);
        setLoadingMessage('');

        if (results.successful.length > 0 || results.ambiguous.length > 0) {
            setCompaniesToConfirm(results);
        } else if (results.failed.length > 0) {
            setError(`Failed to verify any tickers. Please check the symbols. \n\nFirst error: ${results.failed[0].ticker} - ${results.failed[0].reason}`);
        } else {
            setError("No valid tickers were found to generate reports for.");
        }

    } catch (err) {
        setIsLoading(false);
        setLoadingMessage('');
        const reason = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to verify tickers: ${reason}`);
    }
  }, [getFormattedDate]);
  
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) return '';
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const createFallbackCoverPage = (company: Company, currentDate: string): Omit<CoverPageData, 'backgroundImageUrl'> => {
      return {
          industryCategory: 'Other',
          companyName: company.name,
          ticker: company.ticker,
          reportTitle: "Equity Research Report (Fallback Cover)",
          reportDate: currentDate,
          priceTarget: {
              worst: "N/A",
              base: "N/A",
              best: "N/A"
          },
          potentialUpside: "N/A",
          currentPrice: company.currentPrice,
          marketCap: company.marketCap
      };
  };

  const generateAllReports = useCallback(async (companies: Company[]) => {
    isGenerationCancelledRef.current = false;
    setError(null);
    setIsLoading(true);
    setReports([]);
    setActiveReportTab(null);
    
    const currentDate = getFormattedDate();
    const newHistoryItems: ReportHistoryItem[] = [];
    const generatedReports: Report[] = [];
    const startTime = Date.now();
    let reportsCompleted = 0;
    const totalReportsToGenerate = companies.length;

    setProgress({
        totalReports: companies.length,
        currentReportIndex: 1,
        currentReportTicker: companies[0].ticker,
        overall: 0,
        currentReportProgress: 0,
        currentSection: 'Initializing...',
    });

    for (let i = 0; i < companies.length; i++) {
        if (isGenerationCancelledRef.current) {
            setLoadingMessage('Generation stopped by user.');
            break;
        }

        const company = companies[i];
        const reportId = Date.now() + i;
        let accumulatedMarkdown = '';
        
        try {
            // Initial progress state for this report
            setProgress(prev => ({ 
                ...prev!, 
                currentReportIndex: i + 1,
                currentReportTicker: company.ticker,
                overall: (i / totalReportsToGenerate) * 100,
                currentReportProgress: 0,
                currentSection: 'Generating Report...'
            }));

            if (isGenerationCancelledRef.current) break;

            let lastFoundSectionIndex = -1;
            try {
                const reportStream = generateFullReportStream(
                    company, 
                    currentDate, 
                    selectedSections,
                    () => isGenerationCancelledRef.current
                );

                for await (const chunk of reportStream) {
                    if (isGenerationCancelledRef.current) break;
                    
                    accumulatedMarkdown += chunk;
                    
                    let currentSectionIndex = -1;
                    let currentSectionTitle = 'Processing...';
                    
                    for (let j = selectedSections.length - 1; j >= 0; j--) {
                        const sectionHeader = selectedSections[j];
                        const sectionPrefix = sectionHeader.split(' ')[0];
                        if (accumulatedMarkdown.includes(`## ${sectionPrefix}`)) {
                            currentSectionIndex = j;
                            currentSectionTitle = sectionHeader;
                            break;
                        }
                    }

                    if (currentSectionIndex > lastFoundSectionIndex) {
                        lastFoundSectionIndex = currentSectionIndex;
                        const reportBodyProgress = ((currentSectionIndex + 1) / selectedSections.length) * 100;
                        
                        // Calculate overall progress based on sub-task completion
                        const overallProgress = ((i + (reportBodyProgress / 100)) / totalReportsToGenerate) * 100;

                        // Estimate time based on overall progress
                        const now = Date.now();
                        const elapsed = (now - startTime) / 1000;
                        // Avoid wild estimates at the very start
                        if (overallProgress > 2) {
                            const estimatedTotal = elapsed / (overallProgress / 100);
                            const remaining = Math.max(0, estimatedTotal - elapsed);
                            setEstimatedTime(formatTime(remaining));
                        } else {
                            setEstimatedTime("Calculating...");
                        }

                        setProgress(prev => prev ? {
                            ...prev,
                            currentReportProgress: reportBodyProgress,
                            overall: overallProgress,
                            currentSection: `Writing: ${currentSectionTitle}`
                        } : null);
                    }
                }
            } catch (err) {
                 const message = err instanceof Error ? err.message : 'An unknown error occurred while streaming the report.';
                setError(`Failed to generate report for ${company.ticker}: ${message}\n\nGeneration will stop.`);
                setIsLoading(false);
                setProgress(null);
                setEstimatedTime('');
                return;
            }

            if (isGenerationCancelledRef.current) break;
            
            const finalOverallProgress = ((i + 1) / totalReportsToGenerate) * 100;
            setProgress(prev => prev ? {
                ...prev, 
                currentReportProgress: 100, 
                overall: finalOverallProgress,
                currentSection: 'Finalizing Cover Page...'
            } : null);

            let finalCoverPageDataFromReport: Omit<CoverPageData, 'backgroundImageUrl'>;
            try {
                finalCoverPageDataFromReport = await generateCoverPageDataFromReport(accumulatedMarkdown, company, currentDate);
            } catch (coverErr) {
                console.warn("Failed to generate cover page data, using fallback.", coverErr);
                finalCoverPageDataFromReport = createFallbackCoverPage(company, currentDate);
            }

            // No background image for cover page
            const finalCoverPageData: CoverPageData = { ...finalCoverPageDataFromReport, backgroundImageUrl: null };

            const finalReport: Report = {
                id: reportId,
                coverPageData: finalCoverPageData,
                reportContent: accumulatedMarkdown,
            };

            generatedReports.push(finalReport);
            setReports([...generatedReports]);
            setActiveReportTab(reportId);
            
            const coverPageJson = JSON.stringify(finalCoverPageData, null, 2);
            const fullReportContent = `${coverPageJson}\n---END_COVER_PAGE_JSON---\n${accumulatedMarkdown}`;

            const newHistoryItem: ReportHistoryItem = {
                id: reportId,
                ticker: company.ticker,
                companyName: company.name,
                date: currentDate,
                reportContent: fullReportContent,
            };
            newHistoryItems.push(newHistoryItem);

            reportsCompleted++;
            
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate report for ${company.ticker}: ${message}\n\nGeneration will stop.`);
            setIsLoading(false);
            setProgress(null);
            setEstimatedTime('');
            return;
        }
    }
    
    if (newHistoryItems.length > 0) {
        saveHistory([...newHistoryItems, ...reportHistory]);
    }

    setIsLoading(false);
    setProgress(null);
    setEstimatedTime('');
  }, [getFormattedDate, reportHistory, selectedSections]);
  
  const handleStopGeneration = () => {
    isGenerationCancelledRef.current = true;
    setLoadingMessage('Stopping generation...');
  };

  const handleConfirmGeneration = (companies: Company[]) => {
    setCompaniesToConfirm(null);
    generateAllReports(companies);
  };

  const downloadReportAsPdf = async (report: Report) => {
    try {
      if (!(window as any).PDFLib) {
        throw new Error("PDF generation library is not loaded. Please check your internet connection or ad-blockers.");
      }
      
      const pdfBytes = await generateReportPdf(report, theme);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Report-${report.coverPageData.ticker}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setError(`Failed to generate PDF. Details: ${message}`);
        console.error("PDF Generation Error:", error);
    }
  };

  const handleDownloadPdf = async (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    setIsPreparingDownload(true);
    try {
      await downloadReportAsPdf(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to prepare PDF for download. ${message}`);
      console.error(err);
    } finally {
      setIsPreparingDownload(false);
    }
  };
  
  const handleDownloadAllAsPdf = async () => {
    if (reports.length < 1) return;
    setIsPreparingDownload(true);
    setError(null);
    try {
        for (const report of reports) {
            await downloadReportAsPdf(report);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during batch download. Some files may not have saved. ${message}';
        setError(message);
        console.error(err);
    } finally {
        setIsPreparingDownload(false);
    }
  };

  const handleExportCsv = () => {
    if (reports.length === 0) return;
    const headers = [
        "Ticker", "Company Name", "Report Date",
        "Base Price Target", "Worst Price Target", "Best Price Target",
        "Current Price", "Market Cap", "Potential Upside (Base)"
    ];
    const csvRows = [headers.join(',')];
    reports.forEach(report => {
        const { coverPageData: data } = report;
        const row = [
            data.ticker, data.companyName, data.reportDate,
            data.priceTarget.base, data.priceTarget.worst, data.priceTarget.best,
            data.currentPrice, data.marketCap, data.potentialUpside
        ].map(value => `"${String(value).replace(/"/g, '""')}"`);
        csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'equity_reports_summary.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleViewReport = (reportContent: string) => {
    setError(null);
    const { coverPageData, reportContent: markdown } = parseReport(reportContent);
    if (coverPageData && markdown) {
      const newReport = { id: Date.now(), coverPageData, reportContent: markdown };
      setReports([newReport]);
      setActiveReportTab(newReport.id);
    } else {
      setError("Could not parse the selected report.");
    }
    window.scrollTo(0, 0);
  };
  
  const handleClearHistory = () => {
      saveHistory([]);
  };

  const handleCopyToClipboard = (reportId: number) => {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;
      const fullText = `Cover Page:\n${JSON.stringify(report.coverPageData, null, 2)}\n\nReport Content:\n${report.reportContent}`;
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedReportId(reportId);
        setTimeout(() => setCopiedReportId(null), 2000);
      });
  };

  // Zoom Controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(0.9);

  const hasActiveReport = reports.length > 0 && activeReportTab !== null;

  return (
    <div className={`min-h-screen ${hasActiveReport ? 'bg-gray-100 flex flex-col' : 'bg-gray-50'}`}>
      
      {/* Top Header - Always Visible (unless printing) */}
      <header className={`bg-white shadow-sm z-30 ${hasActiveReport ? 'sticky top-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">Money Grow On Tree</h1>
            </div>
            {!hasActiveReport && (
                <div className="text-sm text-gray-500">Institutional-Grade Equity Research</div>
            )}
            
            {hasActiveReport && (
                <div className="flex items-center gap-2">
                    <button onClick={() => { setReports([]); setActiveReportTab(null); }} className="text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-1">
                        New Report
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow ${hasActiveReport ? 'overflow-hidden flex flex-col' : 'p-4 sm:p-6 lg:p-8'}`}>
        
        {/* INPUT MODE (When no report is active) */}
        {!hasActiveReport && !isLoading && (
            <div className="max-w-3xl mx-auto w-full space-y-8 mt-10">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-extrabold text-gray-900">Generate Equity Research</h2>
                    <p className="text-lg text-gray-600">Enter a ticker to generate a comprehensive, professional-grade financial report in minutes.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <TickerInput
                        ticker={tickerInput}
                        setTicker={setTickerInput}
                        onVerify={() => handleVerifyTickers(tickerInput)}
                        isLoading={isLoading}
                    />
                </div>

                <ReportHistory 
                    className="report-history-section"
                    history={reportHistory} 
                    onViewReport={handleViewReport} 
                    onClearHistory={handleClearHistory} 
                />
            </div>
        )}

        {/* LOADING STATE */}
        {isLoading && !progress && <LoadingIndicator message={loadingMessage} />}
        {isLoading && progress && (
          <div className="max-w-2xl mx-auto w-full mt-10 bg-white p-8 rounded-2xl shadow-lg border border-gray-200 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 text-center">Generating Report...</h3>
              <ProgressBar 
                progress={progress.overall} 
                label={`Total Progress (${progress.currentReportIndex}/${progress.totalReports})`}
                subLabel={`${progress.currentReportTicker} | Est. ${estimatedTime} remaining`}
              />
              <ProgressBar 
                progress={progress.currentReportProgress}
                label="Current Section"
                subLabel={progress.currentSection}
              />
              <div className="pt-4 text-center">
                  <button onClick={handleStopGeneration} className="text-red-600 hover:text-red-800 font-medium text-sm">
                      Cancel Generation
                  </button>
              </div>
          </div>
        )}

        {/* REPORT VIEWER MODE */}
        {hasActiveReport && !isLoading && (
            <div className="flex-grow flex flex-col h-full relative">
                {/* Unified Toolbar */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-4 z-20 shadow-sm">
                    {/* Left: Report Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto max-w-[30%] no-scrollbar">
                        {reports.map(report => (
                            <button
                                key={report.id}
                                onClick={() => setActiveReportTab(report.id)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeReportTab === report.id 
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                                }`}
                            >
                                {report.coverPageData.ticker}
                            </button>
                        ))}
                    </div>

                    {/* Center: Zoom Controls */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={handleZoomOut} className="p-1.5 rounded-md hover:bg-white text-gray-600 hover:shadow-sm" title="Zoom Out">-</button>
                        <span className="text-xs font-mono w-12 text-center text-gray-600">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 rounded-md hover:bg-white text-gray-600 hover:shadow-sm" title="Zoom In">+</button>
                        <button onClick={handleResetZoom} className="px-2 py-1.5 ml-1 text-xs text-gray-500 hover:text-gray-800" title="Reset Zoom">Reset</button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <button onClick={() => window.print()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md" title="Print">
                            <PrintIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                const report = reports.find(r => r.id === activeReportTab);
                                if(report) handleDownloadPdf(report.id);
                            }} 
                            disabled={isPreparingDownload}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            {isPreparingDownload ? '...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {/* Scrollable Report Canvas */}
                <div className="flex-grow overflow-auto bg-gray-200/80 p-8 relative flex justify-center">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            style={{ 
                                display: report.id === activeReportTab ? 'block' : 'none',
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top center',
                                width: '21cm', // Base width for scaling
                                marginBottom: '4rem'
                            }}
                            className="transition-transform duration-200 ease-out"
                        >
                            <div className={`report-container theme-${theme} shadow-2xl`}>
                                {/* No internal header here, clean document view */}
                                <CoverPage data={report.coverPageData} />
                                <ReportDisplay markdownContent={report.reportContent} reportId={report.id} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {error && <div className="error-section mt-6 max-w-3xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg whitespace-pre-wrap">{error}</div>}

        {companiesToConfirm && <div className="modal-backdrop"><ConfirmationModal results={companiesToConfirm} onConfirm={handleConfirmGeneration} onCancel={() => setCompaniesToConfirm(null)} onCustomizeSections={() => setIsSectionSelectorOpen(true)} /></div>}

        <SectionSelectorModal
            isOpen={isSectionSelectorOpen}
            onClose={() => setIsSectionSelectorOpen(false)}
            allSections={ALL_REPORT_SECTIONS}
            selectedSections={selectedSections}
            onSave={setSelectedSections}
        />
      </main>
    </div>
  );
};

export default App;
