
import React from 'react';
import { CoverPageData } from '../types';
import { DocumentIcon } from './icons';

interface CoverPageProps {
  data: CoverPageData;
}

const formatMarketCap = (marketCap: string | undefined): string => {
  if (!marketCap) return 'N/A';
  if (marketCap.match(/[KkMmBbTt]/)) {
      return marketCap;
  }
  const cleanStr = marketCap.replace(/[$,\s]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return marketCap;
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return marketCap;
};

const PriceTargetVisualizer: React.FC<{ data: CoverPageData }> = ({ data }) => {
    const parsePrice = (price: string | number | undefined): number => {
        if (typeof price === 'number') return price;
        if (!price || typeof price !== 'string') return 0;
        const cleanStr = price.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    const worstPrice = parsePrice(data.priceTarget?.worst);
    const bestPrice = parsePrice(data.priceTarget?.best);
    const basePrice = parsePrice(data.priceTarget?.base);
    const currentPriceNum = parsePrice(data.currentPrice);
    
    if (basePrice === 0 || currentPriceNum === 0) {
        return null; 
    }

    const minRange = Math.min(worstPrice, currentPriceNum);
    const maxRange = Math.max(bestPrice, currentPriceNum);
    const rangeSpan = maxRange - minRange;
    const padding = rangeSpan === 0 ? maxRange * 0.1 : rangeSpan * 0.15;
    
    const barStart = Math.max(0, minRange - padding);
    const barEnd = maxRange + padding;
    const barRange = barEnd - barStart;

    const getPosition = (value: number): number => {
        if (barRange <= 0) return 50;
        const position = ((value - barStart) / barRange) * 100;
        return Math.max(0, Math.min(100, position));
    };

    const worstPosition = getPosition(worstPrice);
    const bestPosition = getPosition(bestPrice);
    const basePosition = getPosition(basePrice);
    const currentPosition = getPosition(currentPriceNum);

    const markerColor = {
        worst: '#ef4444', 
        base: '#f97316',  
        best: '#22c55e',  
        current: '#6b7280'
    };

    const labelStyle: React.CSSProperties = {
        backgroundColor: 'var(--page-bg-color, white)',
        padding: '2px 6px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
        whiteSpace: 'nowrap',
        zIndex: 10,
        position: 'relative' // relative inside the absolute wrapper
    };

    // Stagger logic: If points are too close, alternate heights
    // Simple heuristic: If absolute difference in position is < 15%, stagger
    const isClose = (p1: number, p2: number) => Math.abs(p1 - p2) < 18;
    
    let baseOffset = 0;
    let worstOffset = 0;
    let bestOffset = 0;

    // Check overlaps and assign offsets (margin-top)
    if (isClose(basePosition, worstPosition)) {
        baseOffset = 35; // Push Base down
    }
    if (isClose(bestPosition, basePosition) && baseOffset === 0) {
        // If Base wasn't already pushed down by Worst
        bestOffset = 35;
    } else if (isClose(bestPosition, basePosition) && baseOffset > 0) {
        // If Base is down, keep Best up, they might be fine, OR push Best down further?
        // Actually if Base is down, Best stays up is usually fine.
        // But if all 3 are close?
        if (isClose(bestPosition, worstPosition)) {
             bestOffset = 70; // Extreme case, stack 3 levels
        }
    }

    return (
        <div className="target-price-visualizer relative pb-32">
            <div className="visualizer-bar-container">
                <div className="visualizer-bar-track"></div>
                <div className="visualizer-bar-range" style={{ left: `${worstPosition}%`, width: `${Math.max(0, bestPosition - worstPosition)}%` }}></div>

                {/* Markers */}
                <div className="visualizer-marker" style={{ left: `${worstPosition}%`, borderColor: markerColor.worst, zIndex: 2 }}></div>
                <div className="visualizer-marker" style={{ left: `${basePosition}%`, borderColor: markerColor.base, zIndex: 3 }}></div>
                <div className="visualizer-marker" style={{ left: `${bestPosition}%`, borderColor: markerColor.best, zIndex: 2 }}></div>
                
                {/* Current Price Marker */}
                <div className="visualizer-marker" style={{ left: `${currentPosition}%`, borderColor: markerColor.current, zIndex: 20, backgroundColor: 'var(--page-bg-color, white)' }}></div>
                
                {/* Current Price Label - Top */}
                <div className="current-price-label-container" style={{ left: `${currentPosition}%`, zIndex: 21, bottom: '24px', position: 'absolute', transform: 'translateX(-50%)' }}>
                    <div style={labelStyle}>
                        <div className="current-price-header" style={{ marginBottom: '2px' }}>
                            <span className="label-dot" style={{ backgroundColor: markerColor.current }}></span>
                            Current
                        </div>
                        <div className="current-price-value">{data.currentPrice}</div>
                    </div>
                </div>
            </div>

            {/* Bottom Labels Container */}
            <div className="visualizer-labels-container relative h-12 mt-4">
                 <div className="visualizer-label-item absolute transform -translate-x-1/2 transition-all duration-300" style={{ left: `${worstPosition}%`, zIndex: 5, marginTop: `${worstOffset}px` }}>
                     <div style={labelStyle}>
                         <div className="label-header">
                             <span className="label-dot" style={{ backgroundColor: markerColor.worst }}></span>
                             Worst
                         </div>
                         <div className="label-price">{data.priceTarget?.worst || 'N/A'}</div>
                     </div>
                     {worstOffset > 0 && <div className="h-8 w-px bg-gray-300 absolute -top-8 left-1/2 transform -translate-x-1/2"></div>}
                 </div>
                 <div className="visualizer-label-item absolute transform -translate-x-1/2 transition-all duration-300" style={{ left: `${basePosition}%`, zIndex: 6, marginTop: `${baseOffset}px` }}>
                     <div style={labelStyle}>
                         <div className="label-header">
                             <span className="label-dot" style={{ backgroundColor: markerColor.base }}></span>
                             Base
                         </div>
                         <div className="label-price">{data.priceTarget?.base || 'N/A'}</div>
                     </div>
                     {baseOffset > 0 && <div className="h-8 w-px bg-gray-300 absolute -top-8 left-1/2 transform -translate-x-1/2"></div>}
                 </div>
                 <div className="visualizer-label-item absolute transform -translate-x-1/2 transition-all duration-300" style={{ left: `${bestPosition}%`, zIndex: 5, marginTop: `${bestOffset}px` }}>
                     <div style={labelStyle}>
                         <div className="label-header">
                             <span className="label-dot" style={{ backgroundColor: markerColor.best }}></span>
                             Best
                         </div>
                         <div className="label-price">{data.priceTarget?.best || 'N/A'}</div>
                     </div>
                     {bestOffset > 0 && <div className="h-8 w-px bg-gray-300 absolute -top-8 left-1/2 transform -translate-x-1/2"></div>}
                 </div>
            </div>
        </div>
    );
};

const CoverPage: React.FC<CoverPageProps> = ({ data }) => {
  const formattedMarketCap = formatMarketCap(data.marketCap);

  return (
    <div className="new-cover-page-container" style={{ '--page-bg-color': 'var(--page-bg-color)', '--main-text-color': 'var(--main-text-color)' } as React.CSSProperties}>
      <aside className="new-cover-page-sidebar">
        <div className="relative flex items-center justify-center w-28 h-28 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <DocumentIcon className="w-14 h-14 text-white" />
        </div>
      </aside>
      <main className="new-cover-page-main">
        <div className="reporting-company-title flex items-center">
          <span>Money Grow On Tree Reporting</span>
        </div>

        <div className="header">
          <p className="subtitle">{data.reportTitle}</p>
          {/* Added line-clamp to prevent long company names from overlapping */}
          <h1 className="company-name line-clamp-2" title={data.companyName}>{data.companyName}</h1>
          <p className="ticker">{data.ticker}</p>
        </div>

        <div className="pre-visualizer-metrics">
            <div className="secondary-metric-item">
                <p className="label">Current Price</p>
                <p className="value">{data.currentPrice}</p>
            </div>
            <div className="secondary-metric-item">
                <p className="label">Market Cap</p>
                <p className="value">{formattedMarketCap}</p>
            </div>
        </div>

        <PriceTargetVisualizer data={data} />

        <hr className="metrics-divider" />

        <div className="secondary-metrics">
          <div className="secondary-metric-item text-center">
            <p className="label">Potential Upside (Base)</p>
            <p className="value text-2xl">{data.potentialUpside}</p>
          </div>
        </div>

        <footer className="new-cover-page-footer">
          <p>Report Date: {data.reportDate}</p>
        </footer>
      </main>
    </div>
  );
};

export default CoverPage;
