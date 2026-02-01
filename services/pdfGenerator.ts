
import { Report, Theme, CoverPageData } from '../types';

// Declare pdf-lib types as they are loaded from a script tag
declare const PDFLib: any;

const { PDFDocument, rgb, StandardFonts, LineCapStyle, PDFName, PDFArray, PDFDict } = PDFLib;

const A4 = { width: 595.28, height: 841.89 };
const MARGINS = { top: 72, bottom: 72, left: 56, right: 56 };

// --- LAYOUT CONSTANTS ---
const CONTENT_X_START = MARGINS.left;
const CONTENT_WIDTH = A4.width - MARGINS.left - MARGINS.right;

// --- THEME DEFINITIONS ---
const THEME_COLORS = {
  default: {
    sidebarBg: rgb(79 / 255, 70 / 255, 229 / 255),
    mainText: rgb(31 / 255, 41 / 255, 55 / 255),
    accent: rgb(99 / 255, 102 / 255, 241 / 255),
    tableHeaderBg: rgb(243 / 255, 244 / 255, 246 / 255),
    tableBorder: rgb(209 / 255, 213 / 255, 219 / 255),
    h2Border: rgb(99 / 255, 102 / 255, 241 / 255)
  },
  classic: {
    sidebarBg: rgb(0 / 255, 31 / 255, 63 / 255),
    mainText: rgb(51 / 255, 51 / 255, 51 / 255),
    accent: rgb(212 / 255, 175 / 255, 55 / 255),
    tableHeaderBg: rgb(230 / 255, 237 / 255, 243 / 255),
    tableBorder: rgb(209 / 255, 213 / 255, 219 / 255),
    h2Border: rgb(212 / 255, 175 / 255, 55 / 255)
  },
  slate: {
    sidebarBg: rgb(45 / 255, 55 / 255, 72 / 255),
    mainText: rgb(45 / 255, 55 / 255, 72 / 255),
    accent: rgb(79 / 255, 209 / 255, 197 / 255),
    tableHeaderBg: rgb(247 / 255, 250 / 255, 252 / 255),
    tableBorder: rgb(226 / 255, 232 / 255, 240 / 255),
    h2Border: rgb(79 / 255, 209 / 255, 197 / 255)
  },
   graphite: {
    sidebarBg: rgb(31 / 255, 41 / 255, 55 / 255),
    mainText: rgb(209 / 255, 213 / 255, 219 / 255),
    pageBg: rgb(17 / 255, 24 / 255, 39 / 255),
    accent: rgb(56 / 255, 189 / 255, 248 / 255),
    tableHeaderBg: rgb(31 / 255, 41 / 255, 55 / 255),
    tableBorder: rgb(75 / 255, 85 / 255, 99 / 255),
    h2Border: rgb(56 / 255, 189 / 255, 248 / 255)
  },
  crimson: {
    sidebarBg: rgb(153 / 255, 27 / 255, 27 / 255),
    mainText: rgb(63 / 255, 37 / 255, 37 / 255),
    pageBg: rgb(254 / 255, 242 / 255, 242 / 255),
    accent: rgb(185 / 255, 28 / 255, 28 / 255),
    tableHeaderBg: rgb(254 / 255, 226 / 255, 226 / 255),
    tableBorder: rgb(254 / 255, 202 / 255, 202 / 255),
    h2Border: rgb(185 / 255, 28 / 255, 28 / 255)
  },
  emerald: {
    sidebarBg: rgb(6 / 255, 95 / 255, 70 / 255),
    mainText: rgb(20 / 255, 83 / 255, 45 / 255),
    pageBg: rgb(240 / 255, 253 / 255, 244 / 255),
    accent: rgb(202 / 255, 138 / 255, 4 / 255),
    tableHeaderBg: rgb(220 / 255, 252 / 255, 231 / 255),
    tableBorder: rgb(187 / 255, 247 / 255, 208 / 255),
    h2Border: rgb(21 / 255, 128 / 255, 61 / 255)
  },
  ocean: {
    sidebarBg: rgb(30 / 255, 58 / 255, 138 / 255),
    mainText: rgb(30 / 255, 58 / 255, 138 / 255),
    pageBg: rgb(239 / 255, 246 / 255, 255 / 255),
    accent: rgb(37 / 255, 99 / 255, 235 / 255),
    tableHeaderBg: rgb(219 / 255, 234 / 255, 254 / 255),
    tableBorder: rgb(191 / 255, 219 / 255, 254 / 255),
    h2Border: rgb(37 / 255, 99 / 255, 235 / 255)
  },
  sunrise: {
    sidebarBg: rgb(154 / 255, 52 / 255, 18 / 255),
    mainText: rgb(124 / 255, 45 / 255, 18 / 255),
    pageBg: rgb(255 / 255, 247 / 255, 237 / 255),
    accent: rgb(234 / 255, 88 / 255, 12 / 255),
    tableHeaderBg: rgb(255 / 255, 237 / 255, 213 / 255),
    tableBorder: rgb(254 / 255, 215 / 255, 170 / 255),
    h2Border: rgb(234 / 255, 88 / 255, 12 / 255)
  },
  paper: {
    sidebarBg: rgb(212 / 255, 200 / 255, 188 / 255),
    mainText: rgb(64 / 255, 56 / 255, 48 / 255),
    pageBg: rgb(253 / 255, 252 / 255, 249 / 255),
    accent: rgb(140 / 255, 126 / 255, 112 / 255),
    tableHeaderBg: rgb(231 / 255, 226 / 255, 219 / 255),
    tableBorder: rgb(220 / 255, 213 / 255, 204 / 255),
    h2Border: rgb(166 / 255, 152 / 255, 136 / 255)
  },
  forest: {
    sidebarBg: rgb(54 / 255, 83 / 255, 20 / 255),
    mainText: rgb(54 / 255, 83 / 255, 20 / 255),
    pageBg: rgb(247 / 255, 254 / 255, 231 / 255),
    accent: rgb(101 / 255, 163 / 255, 13 / 255),
    tableHeaderBg: rgb(236 / 255, 252 / 255, 203 / 255),
    tableBorder: rgb(217 / 255, 249 / 255, 157 / 255),
    h2Border: rgb(101 / 255, 163 / 255, 13 / 255)
  },
  royal: {
    sidebarBg: rgb(91 / 255, 33 / 255, 182 / 255),
    mainText: rgb(91 / 255, 33 / 255, 182 / 255),
    pageBg: rgb(245 / 255, 243 / 255, 255 / 255),
    accent: rgb(124 / 255, 58 / 255, 237 / 255),
    tableHeaderBg: rgb(237 / 255, 233 / 255, 254 / 255),
    tableBorder: rgb(221 / 255, 214 / 255, 254 / 255),
    h2Border: rgb(124 / 255, 58 / 255, 237 / 255)
  },
  industrial: {
    sidebarBg: rgb(55 / 255, 65 / 255, 81 / 255),
    mainText: rgb(31 / 255, 41 / 255, 55 / 255),
    pageBg: rgb(243 / 255, 244 / 255, 246 / 255),
    accent: rgb(245 / 255, 158 / 255, 11 / 255),
    tableHeaderBg: rgb(229 / 255, 231 / 255, 235 / 255),
    tableBorder: rgb(209 / 255, 213 / 255, 219 / 255),
    h2Border: rgb(245 / 255, 158 / 255, 11 / 255)
  },
  quantum: {
    sidebarBg: rgb(2 / 255, 6 / 255, 23 / 255),
    mainText: rgb(226 / 255, 232 / 255, 240 / 255),
    pageBg: rgb(12 / 255, 20 / 255, 39 / 255),
    accent: rgb(34 / 255, 211 / 255, 238 / 255),
    tableHeaderBg: rgb(30 / 255, 41 / 255, 59 / 255),
    tableBorder: rgb(51 / 255, 65 / 255, 85 / 255),
    h2Border: rgb(34 / 255, 211 / 255, 238 / 255)
  }
};

// --- FONT LOADING ---
let fontsCache: any = null;
const loadFonts = async (pdfDoc: any) => {
    if (fontsCache) return fontsCache;

    // Use standard fonts exclusively to ensure reliability and avoid network issues.
    fontsCache = {
        interRegular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        interBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };
    return fontsCache;
};

// --- HELPER: Format Market Cap ---
const formatMarketCapPdf = (marketCap: string): string => {
  if (!marketCap) return 'N/A';
  if (marketCap.match(/[KkMmBbTt]/)) return marketCap;
  const cleanStr = marketCap.replace(/[$,\s]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return marketCap;
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return marketCap;
};

// --- HELPER: Add Internal Link ---
const addInternalLink = (pdfDoc: any, sourcePage: any, rect: number[], targetPage: any) => {
    const link = pdfDoc.context.register(
        pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: rect, // [x1, y1, x2, y2] - PDF coordinates (Bottom-Left origin)
            Border: [0, 0, 0],
            A: {
                Type: 'Action',
                S: 'GoTo',
                D: [targetPage.ref, 'XYZ', null, null, null], // Go to page, keep zoom
            },
        })
    );

    let annots = sourcePage.node.lookup(PDFName.of('Annots'));
    if (!annots) {
        annots = pdfDoc.context.obj([]);
        sourcePage.node.set(PDFName.of('Annots'), annots);
    }
    annots.push(link);
};

// --- PDF TEXT PREPROCESSING ---
function preprocessTextForPdf(text: string): string {
    if (!text) return text;
    return text;
}

const getColumnWidths = (headers: string[], totalWidth: number): number[] => {
    const WIDE_KEYWORDS = [
        'analysis', 'description', 'impact', 'context', 'driver', 'risk', 
        'catalyst', 'thesis', 'overview', 'commentary', 'details', 'reason', 
        'strategy', 'business model', 'product', 'competitor', 'peer', 'implication', 'outlook'
    ];
    
    // Assign weights based on keywords and length
    const weights = headers.map(h => {
        const lowerH = h.toLowerCase();
        if (WIDE_KEYWORDS.some(kw => lowerH.includes(kw))) return 3; // High weight for detailed text columns
        if (h.length > 20) return 2; // Medium weight for long headers
        return 1; // Base weight
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => (w / totalWeight) * totalWidth);
};

// --- PDF DRAWING HELPERS ---

const drawTextWithMaxWidth = (page: any, text: any, options: any) => {
    let fontSize = options.size;
    const minFontSize = options.minFontSize || 8;
    // FIX: Ensure text is always a string before processing
    const processedText = preprocessTextForPdf(String(text));
    
    let textWidth = options.font.widthOfTextAtSize(processedText, fontSize);

    while (textWidth > options.maxWidth && fontSize > minFontSize) {
        fontSize -= 1;
        textWidth = options.font.widthOfTextAtSize(processedText, fontSize);
    }
    
    page.drawText(processedText, { ...options, size: fontSize });
};

const drawPriceTargetVisualizerPdf = (page: any, data: CoverPageData, themeColors: any, fonts: any, xStart: number, yStart: number, width: number) => {
    const parsePrice = (price: string | number | undefined): number => {
        if (typeof price === 'number') return price;
        if (!price || typeof price !== 'string') return 0;
        // Robust parsing: remove everything except digits, dots, and hyphens
        const cleanStr = price.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleanStr);
        return isNaN(parsed) ? 0 : parsed;
    };

    const worstPrice = parsePrice(data.priceTarget.worst);
    const bestPrice = parsePrice(data.priceTarget.best);
    const basePrice = parsePrice(data.priceTarget.base);
    const currentPriceNum = parsePrice(data.currentPrice);

    // Safety check: if invalid data, skip drawing to maintain professional look
    if (basePrice === 0 || currentPriceNum === 0 || bestPrice === 0) {
        return yStart - 20; // Return slightly adjusted Y
    }

    const minRange = Math.min(worstPrice, currentPriceNum);
    const maxRange = Math.max(bestPrice, currentPriceNum);
    const rangeSpan = maxRange - minRange;
    // Add minimal padding to ensure dots aren't cut off at edges
    const padding = rangeSpan === 0 ? maxRange * 0.1 : rangeSpan * 0.15;
    
    const barStart = Math.max(0, minRange - padding);
    const barEnd = maxRange + padding;
    const barRange = barEnd - barStart;

    const getPosition = (value: number): number => {
        if (barRange <= 0) return 50;
        return Math.max(0, Math.min(100, ((value - barStart) / barRange) * 100));
    };

    const worstPosition = getPosition(worstPrice);
    const bestPosition = getPosition(bestPrice);
    const basePosition = getPosition(basePrice);
    const currentPosition = getPosition(currentPriceNum);

    const markerColors = {
        worst: rgb(239/255, 68/255, 68/255),
        base: rgb(249/255, 115/255, 22/255),
        best: rgb(34/255, 197/255, 94/255),
        current: rgb(107/255, 114/255, 128/255),
    };

    const barY = yStart - 40;
    const trackHeight = 8;

    // Draw Track
    page.drawRectangle({ x: xStart, y: barY - trackHeight/2, width, height: trackHeight, color: themeColors.tableBorder, opacity: 0.5 });
    
    // Draw Gradient Range
    const worstAbsX = xStart + width * (worstPosition / 100);
    const bestAbsX = xStart + width * (bestPosition / 100);

    const gradientColors = {
      red: { r: 239/255, g: 68/255, b: 68/255 },
      yellow: { r: 252/255, g: 211/255, b: 77/255 }, // FIXED TYPO: 'd' -> 'g'
      green: { r: 34/255, g: 197/255, b: 94/255 },
    };
    
    const numSteps = 30;
    const rangeX = Math.max(0, bestAbsX - worstAbsX); // Ensure non-negative
    const stepX = rangeX / numSteps;
    
    if (rangeX > 0) {
        for (let i = 0; i < numSteps; i++) {
            const ratio = i / (numSteps - 1);
            let r,g,b;
            if (ratio < 0.5) {
                const localRatio = ratio * 2;
                r = gradientColors.red.r * (1-localRatio) + gradientColors.yellow.r * localRatio;
                g = gradientColors.red.g * (1-localRatio) + gradientColors.yellow.g * localRatio; // Fixed property access
                b = gradientColors.red.b * (1-localRatio) + gradientColors.yellow.b * localRatio;
            } else {
                const localRatio = (ratio - 0.5) * 2;
                r = gradientColors.yellow.r * (1-localRatio) + gradientColors.green.r * localRatio;
                g = gradientColors.yellow.g * (1-localRatio) + gradientColors.green.g * localRatio;
                b = gradientColors.yellow.b * (1-localRatio) + gradientColors.green.b * localRatio;
            }
            page.drawRectangle({ x: worstAbsX + i * stepX, y: barY - trackHeight/2, width: stepX + 0.5, height: trackHeight, color: rgb(r, g, b) });
        }
    }


    // Draw Markers & Labels (Bottom)
    const markers = [
        { pos: worstPosition, color: markerColors.worst, label: 'Worst', value: data.priceTarget.worst },
        { pos: basePosition, color: markerColors.base, label: 'Base', value: data.priceTarget.base },
        { pos: bestPosition, color: markerColors.best, label: 'Best', value: data.priceTarget.best },
    ];
    
    const pageBgColor = themeColors.pageBg || rgb(1,1,1);
    const labelY = barY - 35;
    
    markers.forEach(({ pos, color, label, value }) => {
        const x = xStart + width * (pos / 100);
        page.drawCircle({ x, y: barY, size: 9, color: pageBgColor });
        page.drawCircle({ x, y: barY, size: 7, borderColor: color, borderWidth: 2 });

        const text = `${label}: ${String(value)}`;
        const textWidth = fonts.interRegular.widthOfTextAtSize(text, 9);
        // Draw small background rect for readability
        const bgPadding = 2;
        page.drawRectangle({
            x: x - textWidth/2 - bgPadding,
            y: labelY - 2,
            width: textWidth + bgPadding * 2,
            height: 9 + 4,
            color: pageBgColor,
            opacity: 0.9
        });
        
        page.drawText(text, { x: x - textWidth/2, y: labelY, font: fonts.interRegular, size: 9, color: themeColors.mainText });
    });
    
    // Current Price Marker & Label (Above)
    const currentX = xStart + width * (currentPosition / 100);
    const currentLabelY = barY + 25;
    
    page.drawCircle({ x: currentX, y: barY, size: 9, color: pageBgColor });
    page.drawCircle({ x: currentX, y: barY, size: 7, borderColor: markerColors.current, borderWidth: 2 });
    
    const currentText = `Current: ${String(data.currentPrice)}`;
    const currentTextWidth = fonts.interBold.widthOfTextAtSize(currentText, 10);
    
    // Background for Current Label
    const bgPadding = 3;
    page.drawRectangle({
        x: currentX - currentTextWidth/2 - bgPadding,
        y: currentLabelY - 2,
        width: currentTextWidth + bgPadding * 2,
        height: 10 + 4,
        color: pageBgColor,
        opacity: 0.95
    });

    page.drawText(currentText, { x: currentX - currentTextWidth/2, y: currentLabelY, font: fonts.interBold, size: 10, color: themeColors.mainText });

    return yStart - 90; // Return new Y position
};

const drawCoverPage = (page: any, data: CoverPageData, themeColors: any, fonts: any) => {
    const { width, height } = page.getSize();
    const sidebarWidth = width * 0.35;

    page.drawRectangle({
        x: 0, y: 0, width: sidebarWidth, height, color: themeColors.sidebarBg,
    });
    if (themeColors.pageBg) {
      page.drawRectangle({
        x: sidebarWidth, y: 0, width: width - sidebarWidth, height, color: themeColors.pageBg
      });
    }

    const mainX = sidebarWidth + 50;
    const mainWidth = width - sidebarWidth - 80;
    
    page.drawText(preprocessTextForPdf('Money Grow On Tree Reporting'), {
        x: mainX, y: height - 50, font: fonts.interBold, size: 10, color: themeColors.mainText, opacity: 0.7,
    });

    let y = height - 140;
    page.drawText(preprocessTextForPdf(data.reportTitle), { x: mainX, y, font: fonts.interBold, size: 14, color: themeColors.accent });
    y -= 50;
    
    let companyNameFontSize = 38;
    const companyNameMinFontSize = 18;
    let companyNameLines = wrapText(data.companyName, fonts.interBold, companyNameFontSize, mainWidth);

    while (companyNameLines.length > 2 && companyNameFontSize > companyNameMinFontSize) {
        companyNameFontSize -= 1;
        companyNameLines = wrapText(data.companyName, fonts.interBold, companyNameFontSize, mainWidth);
    }
    const companyNameLineHeight = companyNameFontSize * 1.2;

    companyNameLines.forEach((line, index) => {
        page.drawText(preprocessTextForPdf(line), {
            x: mainX,
            y: y - (index * companyNameLineHeight),
            font: fonts.interBold,
            size: companyNameFontSize,
            color: themeColors.mainText,
        });
    });
    
    const companyNameBlockHeight = companyNameLines.length * companyNameLineHeight;
    y -= (companyNameBlockHeight + 10);

    page.drawText(preprocessTextForPdf(data.ticker), {
        x: mainX,
        y: y,
        font: fonts.interRegular,
        size: 20,
        color: themeColors.mainText,
        opacity: 0.7
    });
    y -= 40;

    const preVisMetrics = [
        { label: 'Current Price', value: data.currentPrice },
        { label: 'Market Cap', value: formatMarketCapPdf(data.marketCap) },
    ];
    const preVisMetricWidth = mainWidth / 2;
    preVisMetrics.forEach((metric, i) => {
        const x = mainX + (i * preVisMetricWidth);
        page.drawText(metric.label, { x, y, font: fonts.interRegular, size: 9, color: themeColors.mainText, opacity: 0.7 });
        drawTextWithMaxWidth(page, String(metric.value), { x, y: y - 20, font: fonts.interBold, size: 14, color: themeColors.mainText, maxWidth: preVisMetricWidth - 10 });
    });
    y -= 25;

    y = drawPriceTargetVisualizerPdf(page, data, themeColors, fonts, mainX, y, mainWidth);
    y -= 20;

    page.drawLine({
        start: { x: mainX, y }, end: { x: width - 50, y }, thickness: 0.5, color: themeColors.tableBorder, opacity: 0.5
    });
    y -= 40;
    
    const upsideText = String(data.potentialUpside);
    const upsideTextWidth = fonts.interBold.widthOfTextAtSize(upsideText, 22);
    const upsideLabel = 'Potential Upside (Base)';
    const upsideLabelWidth = fonts.interRegular.widthOfTextAtSize(upsideLabel, 11);

    page.drawText(upsideLabel, { x: mainX + (mainWidth - upsideLabelWidth) / 2, y, font: fonts.interRegular, size: 11, color: themeColors.mainText, opacity: 0.7 });
    page.drawText(upsideText, { x: mainX + (mainWidth - upsideTextWidth) / 2, y: y - 28, font: fonts.interBold, size: 22, color: themeColors.mainText });
    
    page.drawText(preprocessTextForPdf(`Report Date: ${data.reportDate}`), {
        x: mainX, y: 60, font: fonts.interRegular, size: 10, color: themeColors.mainText, opacity: 0.6
    });
};

const drawHeaderAndFooter = (page: any, pageNum: number, totalPages: number, fonts: any, themeColors: any) => {
  const { height, width } = page.getSize();
  const footerText = 'This report is strictly for educational and informational purposes, not financial advice.';
  const FONT_SIZE = 8;
  const TEXT_WIDTH = fonts.interRegular.widthOfTextAtSize(footerText, FONT_SIZE);
  
  page.drawText(footerText, {
    x: MARGINS.left, 
    y: MARGINS.bottom / 2,
    font: fonts.interRegular, 
    size: FONT_SIZE, 
    color: themeColors.mainText, 
    opacity: 0.6
  });
  
  const pageNumText = `Page ${pageNum} of ${totalPages}`;
  page.drawText(pageNumText, {
    x: width - MARGINS.right - fonts.interRegular.widthOfTextAtSize(pageNumText, FONT_SIZE), 
    y: MARGINS.bottom / 2,
    font: fonts.interRegular, 
    size: FONT_SIZE, 
    color: themeColors.mainText, 
    opacity: 0.6
  });
};

const drawDotNavigator = (page: any, pdfDoc: any, themeColors: any, allSections: string[], currentSection: string, pageSectionMap: Map<number, string>, bodyPageOffset: number) => {
    const NAV_X = A4.width - MARGINS.right + 20;
    const NAV_Y_CENTER = A4.height / 2;
    const DOT_RADIUS = 3;
    const ACTIVE_DOT_RADIUS = 4.5;
    const DOT_SPACING = 18;
    const TOUCH_TARGET_SIZE = 12; // Invisible click area size

    // Calculate total height including TOC dot
    const totalItems = allSections.length + 1; // +1 for TOC
    const totalHeight = (totalItems - 1) * DOT_SPACING;
    const navYStart = NAV_Y_CENTER + (totalHeight / 2);

    // Create a reverse map to find page number from section title
    const sectionPageMap = new Map<string, number>();
    for (const [pageNum, sectionTitle] of pageSectionMap.entries()) {
        if (!sectionPageMap.has(sectionTitle)) {
            sectionPageMap.set(sectionTitle, pageNum);
        }
    }

    // --- Draw TOC Dot (Top) ---
    const tocY = navYStart;
    
    page.drawCircle({
        x: NAV_X,
        y: tocY,
        size: DOT_RADIUS,
        color: themeColors.tableBorder,
    });

    // Link to TOC Page (Index 1)
    if (pdfDoc.getPageCount() > 1) {
        const tocPage = pdfDoc.getPage(1);
        const tocRect = [NAV_X - TOUCH_TARGET_SIZE, tocY - TOUCH_TARGET_SIZE, NAV_X + TOUCH_TARGET_SIZE, tocY + TOUCH_TARGET_SIZE];
        addInternalLink(pdfDoc, page, tocRect, tocPage);
    }

    // --- Draw Section Dots ---
    allSections.forEach((section, index) => {
        // Sections start below TOC dot
        const y = navYStart - ((index + 1) * DOT_SPACING);
        const isActive = section === currentSection;
        const radius = isActive ? ACTIVE_DOT_RADIUS : DOT_RADIUS;
        const color = isActive ? themeColors.accent : themeColors.tableBorder;

        page.drawCircle({
            x: NAV_X,
            y,
            size: radius,
            color,
        });

        // Add Clickable Link
        const targetPageNum = sectionPageMap.get(section);
        if (targetPageNum !== undefined) {
            const pdfPageIndex = targetPageNum + bodyPageOffset - 1; // Convert 1-based logic to 0-based PDF index
            if (pdfPageIndex >= 0 && pdfPageIndex < pdfDoc.getPageCount()) {
                const targetPage = pdfDoc.getPage(pdfPageIndex);
                // Define clickable area (rect: [x1, y1, x2, y2])
                const rect = [NAV_X - TOUCH_TARGET_SIZE, y - TOUCH_TARGET_SIZE, NAV_X + TOUCH_TARGET_SIZE, y + TOUCH_TARGET_SIZE];
                addInternalLink(pdfDoc, page, rect, targetPage);
            }
        }
    });
};


function wrapText(text: any, font: any, fontSize: number, maxWidth: number): string[] {
    const processedText = preprocessTextForPdf(String(text));
    const lines: string[] = [];
    if (!processedText || processedText.trim() === '') return [''];

    const words = processedText.split(' ');
    let currentLine = '';

    for (const word of words) {
        const wordWidth = font.widthOfTextAtSize(word, fontSize);
        if (wordWidth > maxWidth) {
            if (currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = '';
            }
            let tempWord = word;
            while (tempWord.length > 0) {
                let splitIndex = tempWord.length;
                while (font.widthOfTextAtSize(tempWord.substring(0, splitIndex), fontSize) > maxWidth && splitIndex > 1) {
                    splitIndex--;
                }
                if (splitIndex === 0 && tempWord.length > 0) splitIndex = 1;

                lines.push(tempWord.substring(0, splitIndex));
                tempWord = tempWord.substring(splitIndex);
            }
            continue;
        }

        const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
        if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
}

const drawDescriptionParagraph = (context: any, line: string) => {
    const cleanLine = line.replace(/[*#_`]/g, '').trim();
    if (cleanLine === '') return;

    const processedLine = preprocessTextForPdf(cleanLine);
    const words = processedLine.split(/\s+/).filter(Boolean);
    
    const FONT_SIZE = 8;
    const LINE_HEIGHT = 12;
    
    let x = MARGINS.left;
    const spaceWidth = context.fonts.interRegular.widthOfTextAtSize(' ', FONT_SIZE);

    if (context.y < MARGINS.bottom + LINE_HEIGHT) context.addNewPage();

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const font = context.fonts.interRegular;
        const wordWidth = font.widthOfTextAtSize(word, FONT_SIZE);
        
        if (x + wordWidth > A4.width - MARGINS.right) {
            x = MARGINS.left;
            context.y -= LINE_HEIGHT;
            if (context.y < MARGINS.bottom) context.addNewPage();
        }
        
        context.currentPage.drawText(word, { 
            x, 
            y: context.y, 
            font, 
            size: FONT_SIZE, 
            color: context.themeColors.mainText,
            opacity: 0.75
        });
        x += wordWidth + spaceWidth;
    }
    context.y -= (LINE_HEIGHT + 10);
}

const drawFormattedParagraph = (context: any, line: string) => {
    const processedLine = preprocessTextForPdf(line);
    const boldMatch = processedLine.match(/^\*\*(.*?)\*\*/);
    const textToProcess = processedLine.replace(/\*\*/g, '');
    const words = textToProcess.split(/\s+/).filter(Boolean);
    const boldWordCount = boldMatch ? boldMatch[1].split(/\s+/).filter(Boolean).length : 0;
    
    const FONT_SIZE = 10;
    const LINE_HEIGHT = 15;
    
    let x = MARGINS.left;
    const spaceWidth = context.fonts.interRegular.widthOfTextAtSize(' ', FONT_SIZE);

    if (context.y < MARGINS.bottom + LINE_HEIGHT) context.addNewPage();

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const font = i < boldWordCount ? context.fonts.interBold : context.fonts.interRegular;
        const wordWidth = font.widthOfTextAtSize(word, FONT_SIZE);
        
        if (x + wordWidth > A4.width - MARGINS.right) {
            x = MARGINS.left;
            context.y -= LINE_HEIGHT;
            if (context.y < MARGINS.bottom) context.addNewPage();
        }
        
        context.currentPage.drawText(word, { x, y: context.y, font, size: FONT_SIZE, color: context.themeColors.mainText });
        x += wordWidth + spaceWidth;
    }
    context.y -= (LINE_HEIGHT + 5);
}

const BOLD_TABLE_KEYWORDS = [
    'revenue', 'net sales', 'sales revenue', 'total revenue', 'profit', 'net income', 
    'net earnings', 'gross profit', 'operating income', 'total assets', 'total liabilities', 
    'equity', "shareholders' equity", 'total equity', 'cfo', 'cfi', 'cff', 'net cash'
];

const formatNumberCell = (text: string): string => {
    const trimmed = text.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) return trimmed;
    if (trimmed.startsWith('-')) return `(${trimmed.substring(1)})`;
    return text;
};

const renderMarkdown = (context: any, markdown: string, isTOC: boolean) => {
    const checkNewPage = (requiredHeight: number) => {
        if (context.y - requiredHeight < MARGINS.bottom) context.addNewPage();
    };

    let tableBuffer: string[] = [];
    let inAppendix = false;
    let justDrewTable = false;

    const drawTable = () => {
        if (tableBuffer.length < 2) { tableBuffer = []; return; }
        const headers = tableBuffer[0].split('|').slice(1, -1).map(h => h.trim().replace(/\*\*/g, ''));
        const rows = tableBuffer.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        tableBuffer = [];
        
        if (headers.length === 0) return;
        
        const colWidths = getColumnWidths(headers, CONTENT_WIDTH);
        
        // Detect text-heavy tables (like Catalyst, Risk, Events) to use larger font
        const TEXT_HEAVY_KEYWORDS = ['event', 'impact', 'description', 'risk', 'catalyst', 'thesis', 'overview', 'driver', 'context'];
        const isTextHeavy = headers.some(h => TEXT_HEAVY_KEYWORDS.some(kw => h.toLowerCase().includes(kw)));

        const PADDING = isTextHeavy ? 3 : 2; 
        const FONT_SIZE = isTextHeavy ? 9 : 7; // Use 9pt for text-heavy, 7pt for data-heavy
        const LINE_HEIGHT = isTextHeavy ? 11 : 9;

        const calculateRowHeight = (cells: string[], font: any) => {
            let maxLines = 1;
            cells.forEach((cell, i) => {
                const width = colWidths[i] || (CONTENT_WIDTH / headers.length);
                const lines = wrapText(String(cell).replace(/\*\*/g, ''), font, FONT_SIZE, width - PADDING * 2);
                maxLines = Math.max(maxLines, lines.length);
            });
            return maxLines * LINE_HEIGHT + PADDING * 2;
        };

        const headerHeight = calculateRowHeight(headers, context.fonts.interBold);
        checkNewPage(headerHeight);
        
        let currentX = CONTENT_X_START;
        headers.forEach((header, i) => {
            const width = colWidths[i];
            context.currentPage.drawRectangle({
                x: currentX, y: context.y - headerHeight, width: width, height: headerHeight,
                color: context.themeColors.tableHeaderBg,
            });
            const lines = wrapText(header, context.fonts.interBold, FONT_SIZE, width - PADDING * 2);
            lines.forEach((line, lineIndex) => {
                context.currentPage.drawText(line, {
                    x: currentX + PADDING, y: context.y - PADDING - FONT_SIZE - (lineIndex * LINE_HEIGHT),
                    font: context.fonts.interBold, size: FONT_SIZE, color: context.themeColors.mainText,
                });
            });
            currentX += width;
        });
        context.y -= headerHeight;
        
        rows.forEach((row) => {
            const isBoldRow = BOLD_TABLE_KEYWORDS.some(kw => (row[0] || '').toLowerCase().includes(kw));
            const font = isBoldRow ? context.fonts.interBold : context.fonts.interRegular;
            const rowHeight = calculateRowHeight(row, font);
            checkNewPage(rowHeight);

            let rowX = CONTENT_X_START;
            row.forEach((cell, i) => {
                const width = colWidths[i] || (CONTENT_WIDTH / headers.length);
                context.currentPage.drawRectangle({
                    x: rowX, y: context.y - rowHeight, width: width, height: rowHeight,
                    borderColor: context.themeColors.tableBorder, borderWidth: 0.5
                });
                const formattedCell = i > 0 ? formatNumberCell(cell) : cell;
                const wrappedCell = wrapText(formattedCell.replace(/\*\*/g, ''), font, FONT_SIZE, width - PADDING * 2);
                wrappedCell.forEach((line, lineIndex) => {
                    context.currentPage.drawText(line, {
                        x: rowX + PADDING, y: context.y - PADDING - FONT_SIZE - (lineIndex * LINE_HEIGHT),
                        font, size: FONT_SIZE, color: context.themeColors.mainText,
                    });
                });
                rowX += width;
            });
            context.y -= rowHeight;
        });
        context.y -= 15; // Reduced margin below table
        justDrewTable = true;
    };

    for (const line of markdown.split('\n')) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('|')) {
            tableBuffer.push(line);
            justDrewTable = false;
            continue;
        }
        if (tableBuffer.length > 0) drawTable();

        if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ')) {
            justDrewTable = false;
            const isH2 = trimmedLine.startsWith('## ');
            const text = trimmedLine.substring(isH2 ? 3 : 4).trim().replace(/\*\*/g, '');
            const fontSize = isH2 ? 18 : 14;
            const font = context.fonts.interBold;

            if (isH2) {
                const cleanTitle = text.replace(/^\d+\.?\d*\.?\s*/, '').trim();
                context.currentSection = cleanTitle;
            }
            if (isH2 && text.toLowerCase().includes('appendix')) {
                if (context.y < A4.height - MARGINS.top) {
                    context.addNewPage();
                }
                inAppendix = true;
            } else if (line.toLowerCase().includes('appendix')) {
                inAppendix = true;
            }

            context.y -= isH2 ? 30 : 20;
            checkNewPage(fontSize + (isH2 ? 15 : 0));
            context.currentPage.drawText(preprocessTextForPdf(text), { x: CONTENT_X_START, y: context.y, font, size: fontSize, color: context.themeColors.mainText });
            
            if(isH2) {
                const spaceBelowText = 5;
                context.y -= spaceBelowText;
                context.currentPage.drawLine({
                    start: { x: CONTENT_X_START, y: context.y }, end: { x: A4.width - MARGINS.right, y: context.y }, thickness: 1, color: context.themeColors.h2Border,
                });
                context.y -= 15;
            } else {
                context.y -= (fontSize * 1.4);
            }

        } else if (trimmedLine.startsWith('* ')) {
            justDrewTable = false;
            const text = trimmedLine.substring(2).replace(/\*\*/g, ''); // Strip bold markers for list items
            if (isTOC) {
                 const parts = text.split('|||');
                if (parts.length === 2) {
                    const title = parts[0].trim().replace(/\*\*/g, '');
                    const pageNum = parts[1].trim();
                    const indent = line.match(/^\s*/)?.[0].length || 0;
                    const isSubTopic = indent > 1;
                    const xPos = MARGINS.left + (isSubTopic ? 20 : 0);
                    
                    // Reduced font size for TOC to fit on one page
                    const FONT_SIZE = 9; 
                    const LINE_HEIGHT = 12;

                    const pageNumWidth = context.fonts.interRegular.widthOfTextAtSize(pageNum, FONT_SIZE);
                    const availableWidth = (A4.width - MARGINS.right) - xPos - pageNumWidth - 15;

                    const wrappedLines = wrapText(title, context.fonts.interRegular, FONT_SIZE, availableWidth);
                    const requiredHeight = wrappedLines.length * LINE_HEIGHT;

                    if (context.y - requiredHeight < MARGINS.bottom) {
                        context.addNewPage();
                    }

                    // Draw Title Text
                    wrappedLines.forEach((line: string, index: number) => {
                        const currentY = context.y - (index * LINE_HEIGHT);
                        context.currentPage.drawText(preprocessTextForPdf(line), {
                            x: xPos,
                            y: currentY,
                            font: context.fonts.interRegular,
                            size: FONT_SIZE,
                            color: context.themeColors.mainText,
                        });
                    });

                    // ADD CLICKABLE LINK TO TOC ITEM
                    const targetPageNum = parseInt(pageNum, 10);
                    if (!isNaN(targetPageNum)) {
                        const pdfDoc = context.pdfDoc;
                        const pdfPageIndex = targetPageNum - 1; // 0-indexed page index
                        
                        if (pdfPageIndex >= 0 && pdfPageIndex < pdfDoc.getPageCount()) {
                            const targetPage = pdfDoc.getPage(pdfPageIndex);
                            // Define clickable rect for the whole TOC item line
                            // Rect: [x, bottom, x+w, top]
                            // context.y is the baseline of the first line. 
                            // Bottom of block is: context.y - (lines-1)*LH - descender space (approx 2)
                            // Top of block is: context.y + capHeight (approx FONT_SIZE)
                            const rectBottom = context.y - ((wrappedLines.length - 1) * LINE_HEIGHT) - 2;
                            const rectTop = context.y + FONT_SIZE;
                            
                            const rect = [
                                xPos, 
                                rectBottom, 
                                A4.width - MARGINS.right, 
                                rectTop
                            ];
                            addInternalLink(pdfDoc, context.currentPage, rect, targetPage);
                        }
                    }

                    const lastLineY = context.y - ((wrappedLines.length - 1) * LINE_HEIGHT);
                    context.currentPage.drawText(pageNum, {
                        x: A4.width - MARGINS.right - pageNumWidth,
                        y: lastLineY,
                        font: context.fonts.interRegular,
                        size: FONT_SIZE,
                        color: context.themeColors.mainText,
                    });

                    const lastLineText = wrappedLines[wrappedLines.length - 1];
                    const lastLineWidth = context.fonts.interRegular.widthOfTextAtSize(preprocessTextForPdf(lastLineText), FONT_SIZE);
                    const dotX = xPos + lastLineWidth + 5;
                    const dotEndX = A4.width - MARGINS.right - pageNumWidth - 5;
                    
                    if (dotEndX > dotX) {
                        context.currentPage.drawLine({
                            start: { x: dotX, y: lastLineY + 3 },
                            end: { x: dotEndX, y: lastLineY + 3 },
                            thickness: 1,
                            color: context.themeColors.mainText,
                            opacity: 0.5,
                            dashArray: [0, 3],
                            dashPhase: 0,
                            lineCap: LineCapStyle.Round,
                        });
                    }
                    
                    context.y -= requiredHeight + 6;
                }
            } else {
                 const wrappedLines = wrapText(text, context.fonts.interRegular, 10, CONTENT_WIDTH - 20);
                checkNewPage(wrappedLines.length * 15);
                context.currentPage.drawCircle({ x: CONTENT_X_START + 5, y: context.y + 4, size: 2, color: context.themeColors.mainText });
                wrappedLines.forEach((l: string, i: number) => {
                    context.currentPage.drawText(l, { x: CONTENT_X_START + 20, y: context.y - (i * 15), font: context.fonts.interRegular, size: 10, color: context.themeColors.mainText, lineHeight: 15 });
                });
                context.y -= (wrappedLines.length * 15 + 5);
            }
        } else if (trimmedLine !== '') {
            if (justDrewTable) {
                drawDescriptionParagraph(context, line);
                justDrewTable = false;
            } else {
                drawFormattedParagraph(context, line);
            }
        } else {
            justDrewTable = false;
        }
    }
    if (tableBuffer.length > 0) drawTable();
}

const layoutMarkdown = (context: any, markdown: string) => {
    const checkNewPage = (requiredHeight: number) => {
        if (context.y - requiredHeight < MARGINS.bottom) {
            context.addNewPage();
        }
    };

    let tableBuffer: string[] = [];

    const calculateParagraphHeight = (line: string): number => {
        const textToProcess = line.replace(/\*\*/g, '');
        const words = textToProcess.split(/\s+/).filter(Boolean);
        const FONT_SIZE = 10;
        const LINE_HEIGHT = 15;
        
        if (words.length === 0) return 0;

        let x = CONTENT_X_START;
        let lines = 1;
        const spaceWidth = context.fonts.interRegular.widthOfTextAtSize(' ', FONT_SIZE);

        for (const word of words) {
            const font = context.fonts.interRegular; 
            const wordWidth = font.widthOfTextAtSize(word, FONT_SIZE);
            if (x + wordWidth > A4.width - MARGINS.right) {
                lines++;
                x = CONTENT_X_START;
            }
            x += wordWidth + spaceWidth;
        }
        return (lines * LINE_HEIGHT) + 5;
    };

    const calculateTableHeight = (): number => {
        if (tableBuffer.length < 2) { tableBuffer = []; return 0; }
        const headers = tableBuffer[0].split('|').slice(1, -1).map(h => h.trim().replace(/\*\*/g, ''));
        const rows = tableBuffer.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        tableBuffer = [];
        if (headers.length === 0) return 0;

        const colWidths = getColumnWidths(headers, CONTENT_WIDTH);
        
        // Match logic from renderMarkdown for text-heavy tables
        const TEXT_HEAVY_KEYWORDS = ['event', 'impact', 'description', 'risk', 'catalyst', 'thesis', 'overview', 'driver', 'context'];
        const isTextHeavy = headers.some(h => TEXT_HEAVY_KEYWORDS.some(kw => h.toLowerCase().includes(kw)));

        const PADDING = isTextHeavy ? 3 : 2; 
        const FONT_SIZE = isTextHeavy ? 9 : 7; 
        const LINE_HEIGHT = isTextHeavy ? 11 : 9;

        const getRowHeight = (cells: string[], font: any) => {
            let maxLines = 1;
            cells.forEach((cell, i) => {
                const width = colWidths[i] || (CONTENT_WIDTH / headers.length);
                const lines = wrapText(String(cell).replace(/\*\*/g, ''), font, FONT_SIZE, width - PADDING * 2);
                maxLines = Math.max(maxLines, lines.length);
            });
            return maxLines * LINE_HEIGHT + PADDING * 2;
        };

        let totalHeight = getRowHeight(headers, context.fonts.interBold);
        rows.forEach(row => {
            const isBoldRow = BOLD_TABLE_KEYWORDS.some(kw => (row[0] || '').toLowerCase().includes(kw));
            const font = isBoldRow ? context.fonts.interBold : context.fonts.interRegular;
            totalHeight += getRowHeight(row, font);
        });
        
        return totalHeight + 15; // Reduced margin below table
    };


    for (const line of markdown.split('\n')) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('|')) {
            tableBuffer.push(line);
            continue;
        }
        if (tableBuffer.length > 0) {
            const tableHeight = calculateTableHeight();
            checkNewPage(tableHeight);
            context.y -= tableHeight;
        }

        if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ')) {
            const isH2 = trimmedLine.startsWith('## ');
            const text = trimmedLine.substring(isH2 ? 3 : 4).trim().replace(/\*\*/g, '');
            const fontSize = isH2 ? 18 : 14;

            let headerHeight;
            if (isH2) {
                headerHeight = 30 + 5 + 15;
            } else { 
                headerHeight = 20 + (fontSize * 1.4);
            }
            
            checkNewPage(headerHeight);
            context.recordHeader(text);
            context.y -= headerHeight;

        } else if (trimmedLine.startsWith('* ')) {
             const text = trimmedLine.substring(2).replace(/\*\*/g, ''); // Strip bold markers
             const wrappedLines = wrapText(text, context.fonts.interRegular, 10, CONTENT_WIDTH - 20);
             const height = (wrappedLines.length * 15 + 5);
             checkNewPage(height);
             context.y -= height;

        } else if (trimmedLine !== '') {
            const pHeight = calculateParagraphHeight(line);
            checkNewPage(pHeight);
            context.y -= pHeight;
        }
    }
    if (tableBuffer.length > 0) {
        const tableHeight = calculateTableHeight();
        checkNewPage(tableHeight);
        context.y -= tableHeight;
    }
};

// --- MAIN PDF GENERATION LOGIC ---
export const generateReportPdf = async (report: Report, theme: Theme): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const fonts = await loadFonts(pdfDoc);
    
    const themeKey = (theme as string) === 'midnight' ? 'graphite' : theme;
    const themeColors = THEME_COLORS[themeKey as keyof typeof THEME_COLORS] || THEME_COLORS.classic;
    
    const preprocessedReportContent = preprocessTextForPdf(report.reportContent);

    const tocRegex = /## Table of Contents[\s\S]*?(?=## |$)/g;
    const bodyContent = preprocessedReportContent.replace(tocRegex, '').trim();

    const allH2Sections: string[] = [];
    const headerRegexForList = /^(## )(.+)/gm;
    let m;
    while ((m = headerRegexForList.exec(bodyContent)) !== null) {
        const cleanTitle = m[2].trim().replace(/\*\*/g, '').replace(/^\d+\.?\d*\.?\s*/, '').trim();
        if (cleanTitle.toLowerCase() !== 'appendix' && cleanTitle.toLowerCase() !== 'table of contents') {
             allH2Sections.push(cleanTitle);
        }
    }

    const headerPageMap = new Map<string, number>();
    const pageSectionMap = new Map<number, string>();
    let currentSectionForLayout = allH2Sections.length > 0 ? allH2Sections[0] : '';
    
    const simulationContext = {
        y: A4.height - MARGINS.top,
        currentPageNumber: 1, 
        fonts,
        addNewPage: function() {
            pageSectionMap.set(this.currentPageNumber, currentSectionForLayout);
            this.y = A4.height - MARGINS.top;
            this.currentPageNumber++;
        },
        recordHeader: function(title: string) {
            const cleanTitle = title.replace(/^\d+\.?\d*\.?\s*/, '').trim();
            if (allH2Sections.includes(cleanTitle)) {
                currentSectionForLayout = cleanTitle;
            }
            if (!headerPageMap.has(title)) {
                headerPageMap.set(title, this.currentPageNumber);
            }
        }
    };
    layoutMarkdown(simulationContext, bodyContent);
    pageSectionMap.set(simulationContext.currentPageNumber, currentSectionForLayout);

    let newTocMarkdown = '## Table of Contents\n\n';
    const headerRegex = /^(## |### )(.+)/gm;
    let match;
    const tocPageOffset = 2; // Cover page + TOC page (approx) usually starts body on p3, but here TOC is on p2.
    // Body starts after TOC. If TOC is 1 page, Body starts on Page 3 (index 2). 
    // PDF pages 0-indexed: Cover(0), TOC(1), Body(2...).
    // Our map uses 1-based index relative to start of body.
    // So if Map says Page 1, it corresponds to PDF Page (tocPageOffset + 1 - 1) = index 2.

    let h2Counter = 0;
    let h3Counter = 0;

    while ((match = headerRegex.exec(bodyContent)) !== null) {
        const isH2 = match[1] === '## ';
        const originalTitle = match[2].trim().replace(/\*\*/g, '');
        const pageNum = headerPageMap.get(originalTitle);
        
        if (pageNum !== undefined) {
            const cleanTitleForDisplay = originalTitle.replace(/^\d+\.?\d*\.?\s*/, '').trim();
            let numberedTitle = '';
            const indent = isH2 ? '' : '  ';

            if (isH2) {
                h2Counter++;
                h3Counter = 0;
                numberedTitle = `${h2Counter}.0 ${cleanTitleForDisplay}`;
            } else { 
                h3Counter++;
                numberedTitle = `${h2Counter}.${h3Counter} ${cleanTitleForDisplay}`;
            }
            newTocMarkdown += `${indent}* ${numberedTitle} ||| ${pageNum + tocPageOffset}\n`;
        }
    }

    const coverPage = pdfDoc.addPage([A4.width, A4.height]);
    drawCoverPage(coverPage, report.coverPageData, themeColors, fonts);

    const drawContext = {
        pdfDoc,
        currentPage: null as any,
        y: 0,
        fonts,
        themeColors,
        currentSection: '',
        allH2Sections,
        bodyPageOffset: tocPageOffset, // Pass offset to renderMarkdown for link calculation
        addNewPage: function() {
            this.currentPage = this.pdfDoc.addPage([A4.width, A4.height]);
            if (this.themeColors.pageBg) {
                this.currentPage.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: this.themeColors.pageBg });
            }
            this.y = A4.height - MARGINS.top;
        }
    };

    drawContext.addNewPage(); // TOC Page (Index 1)
    renderMarkdown(drawContext, newTocMarkdown, true);

    if (bodyContent) {
        drawContext.addNewPage(); // Body Start (Index 2)
        renderMarkdown(drawContext, bodyContent, false);
    }

    const pages = pdfDoc.getPages();
    const bodyPageOffsetVal = 2;
    pages.forEach((page, i) => {
      if (i >= bodyPageOffsetVal) {
        const bodyPageIndex = i - bodyPageOffsetVal + 1;
        const pageSection = pageSectionMap.get(bodyPageIndex);
        if (pageSection) {
            // Pass pdfDoc and offsets to allow creating links in dots
            drawDotNavigator(page, pdfDoc, themeColors, allH2Sections, pageSection, pageSectionMap, bodyPageOffsetVal);
        }
      }
      if (i > 0) { 
        drawHeaderAndFooter(page, i + 1, pages.length, fonts, themeColors);
      }
    });

    return pdfDoc.save();
};
