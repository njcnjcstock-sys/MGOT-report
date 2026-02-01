
import React, { useState, useEffect } from 'react';
import { Company, VerificationResults } from '../types';

interface ConfirmationModalProps {
  results: VerificationResults;
  onConfirm: (companies: Company[]) => void;
  onCancel: () => void;
  onCustomizeSections: () => void;
}

interface CompanyCardProps {
    company: Company;
    isSelected: boolean;
    onToggle: () => void;
    isPrimary?: boolean;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, isSelected, onToggle, isPrimary }) => {
    return (
        <div 
            onClick={onToggle}
            className={`
                relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 group
                ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                }
            `}
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-lg ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                            {company.ticker}
                        </h4>
                        {isPrimary && (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-indigo-200">
                                Primary
                            </span>
                        )}
                        {!isPrimary && (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-gray-200">
                                Peer
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-gray-600 line-clamp-1" title={company.name}>{company.name}</p>
                </div>
                <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white group-hover:border-indigo-400'}
                `}>
                    {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            </div>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div>
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider text-[10px]">Price</span>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {company.currentPrice}
                    </span>
                </div>
                <div>
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider text-[10px]">Market Cap</span>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {company.marketCap}
                    </span>
                </div>
                <div className="col-span-2 mt-1">
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider text-[10px]">Exchange / Country</span>
                    <span className={`font-medium ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>
                        {company.exchange}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ results, onConfirm, onCancel, onCustomizeSections }) => {
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  
  // Store all available companies mapped by ticker for easy access
  const [availableCompanies, setAvailableCompanies] = useState<Map<string, Company>>(new Map());
  
  // State for ambiguous selections (which candidate did the user pick?)
  const [ambiguousSelections, setAmbiguousSelections] = useState<Record<string, Company | null>>({});

  useEffect(() => {
    const companies = new Map<string, Company>();
    const initialSelection = new Set<string>();

    // Process Successful matches
    results.successful.forEach(company => {
        companies.set(company.ticker, company);
        initialSelection.add(company.ticker); // Default select main companies

        // Process Peers
        if (company.peers) {
            company.peers.forEach(peer => {
                // Only add if not already present (prefer main result data)
                if (!companies.has(peer.ticker)) {
                    companies.set(peer.ticker, peer);
                }
            });
        }
    });

    setAvailableCompanies(companies);
    setSelectedTickers(initialSelection);
    
    // Initialize ambiguous selections map
    const initialAmbiguous: Record<string, Company | null> = {};
    results.ambiguous.forEach(item => {
        initialAmbiguous[item.input] = null;
    });
    setAmbiguousSelections(initialAmbiguous);

  }, [results]);

  const handleToggleTicker = (ticker: string) => {
    setSelectedTickers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(ticker)) {
            newSet.delete(ticker);
        } else {
            newSet.add(ticker);
        }
        return newSet;
    });
  };

  const handleResolveAmbiguous = (input: string, candidate: Company) => {
      setAmbiguousSelections(prev => ({
          ...prev,
          [input]: candidate
      }));
      // Add to selected immediately
      handleToggleTicker(candidate.ticker);
      
      // Also add to available map if not there
      if (!availableCompanies.has(candidate.ticker)) {
          setAvailableCompanies(prev => new Map(prev).set(candidate.ticker, candidate));
      }
  };

  const getFinalList = () => {
      return Array.from(selectedTickers).map(ticker => availableCompanies.get(ticker)).filter((c): c is Company => !!c);
  };

  const finalList = getFinalList();
  const hasSelection = finalList.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Select Companies</h2>
                <p className="text-gray-500 text-sm mt-1">Choose the companies you want to generate reports for.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm border border-indigo-100">
                {selectedTickers.size} Selected
            </div>
        </div>
        
        <div className="overflow-y-auto p-8 bg-gray-50 flex-grow">
          
          {/* Section: Verified Companies & Peers */}
          {results.successful.map((company) => (
              <div key={company.ticker} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-lg font-bold text-gray-800">
                          Found: {company.name}
                      </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {/* Main Company Card */}
                        <CompanyCard 
                            company={company}
                            isSelected={selectedTickers.has(company.ticker)}
                            onToggle={() => handleToggleTicker(company.ticker)}
                            isPrimary={true}
                        />
                  </div>

                  {company.peers && company.peers.length > 0 && (
                      <div className="pl-4 border-l-2 border-gray-200 ml-1">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Comparable Peers
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {company.peers.map(peer => {
                                  // Skip if peer is the same as main company (duplicate prevention)
                                  if (peer.ticker === company.ticker) return null;
                                  
                                  return (
                                      <CompanyCard 
                                          key={peer.ticker}
                                          company={peer}
                                          isSelected={selectedTickers.has(peer.ticker)}
                                          onToggle={() => handleToggleTicker(peer.ticker)}
                                          isPrimary={false}
                                      />
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>
          ))}

          {/* Section: Ambiguous Results */}
          {results.ambiguous.length > 0 && (
              <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                          <h3 className="text-lg font-bold text-yellow-800">Multiple Matches Found</h3>
                          <p className="text-sm text-yellow-700">We couldn't identify a single company for some inputs. Please select the correct one.</p>
                      </div>
                  </div>
                  
                  <div className="space-y-6">
                      {results.ambiguous.map((item) => (
                          <div key={item.input} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                              <p className="font-medium text-gray-700 mb-3">Search Input: <span className="font-bold text-gray-900">"{item.input}"</span></p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                  {item.candidates.map((candidate) => (
                                      <CompanyCard 
                                          key={candidate.ticker}
                                          company={candidate}
                                          isSelected={selectedTickers.has(candidate.ticker)}
                                          onToggle={() => handleResolveAmbiguous(item.input, candidate)}
                                          isPrimary={false}
                                      />
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {/* Section: Failed Results */}
          {results.failed.length > 0 && (
            <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100">
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Not Found
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {results.failed.map(({ ticker, reason }) => (
                  <li key={ticker} className="text-sm text-red-700">
                    <span className="font-semibold">{ticker}:</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end items-center gap-4 z-10">
          <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={onCancel}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none"
              >
                Cancel
              </button>
               <button
                onClick={onCustomizeSections}
                disabled={!hasSelection}
                className="flex-1 sm:flex-none px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-300 focus:outline-none"
              >
                Customize Sections
              </button>
          </div>
          <button
            onClick={() => onConfirm(finalList)}
            disabled={!hasSelection}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform active:scale-95 disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-indigo-200 focus:ring-4 focus:ring-indigo-100 focus:outline-none flex items-center justify-center gap-2"
          >
            {hasSelection ? (
                <>
                    <span>Generate {finalList.length} Report{finalList.length !== 1 ? 's' : ''}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </>
            ) : (
                'Select at least one company'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
