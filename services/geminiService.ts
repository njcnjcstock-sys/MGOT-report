
import { GoogleGenAI } from "@google/genai";
// FIX: Import the shared VerificationResults type.
import { Company, CoverPageData, VerificationResults } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses errors from the Gemini API and returns a user-friendly message.
 * @param error The error object.
 * @param context A string describing the context where the error occurred.
 * @returns A user-friendly error string.
 */
const parseGeminiError = (error: unknown, context: string): string => {
    console.error(`Error during ${context}:`, error);

    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Check for specific error patterns from the Gemini API or network issues
        if (errorMessage.includes('api key not valid')) {
            return `API Key Invalid: The API key is not valid. Please check your configuration. [Context: ${context}]`;
        }
        if (errorMessage.includes('rate limit')) {
            return `Rate Limit Exceeded: Too many requests sent in a short period. Please wait and try again later. [Context: ${context}]`;
        }
        if (errorMessage.includes('429')) { // Another way to check for rate limiting
            return `Rate Limit Exceeded (429): Too many requests. Please wait and try again later. [Context: ${context}]`;
        }
        if (errorMessage.includes('503') || errorMessage.includes('model is overloaded') || errorMessage.includes('service unavailable')) {
            return `Service Unavailable (503): The AI service is currently overloaded or unavailable. Please try again later. [Context: ${context}]`;
        }
        if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
            return `Content Moderation: The request was blocked for safety reasons. Please modify your input and try again. [Context: ${context}]`;
        }
        if (error instanceof SyntaxError || errorMessage.includes('failed to parse')) {
             return `Invalid Response: The AI service returned a response that could not be understood. Please try again. [Context: ${context}]`;
        }
        
        // Return a generic but informative message for other errors
        return `An unexpected error occurred: ${error.message}. [Context: ${context}]`;
    }

    return `An unknown error occurred. [Context: ${context}]`;
};

/**
 * Converts a File object to a GoogleGenAI.Part object for multimodal requests.
 * @param file The file to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

/**
 * Extracts stock tickers from a given PDF file using a multimodal prompt.
 * @param file The PDF file to analyze.
 * @returns A promise that resolves to a comma-separated string of tickers.
 */
export const extractTickersFromPdf = async (file: File): Promise<string> => {
    const filePart = await fileToGenerativePart(file);
    const prompt = `
      You are an intelligent data extraction API. Your task is to analyze the provided PDF document, which contains information about stocks.
      The document might have tables with columns such as 'Company Name', 'Ticker Symbol', 'Exchange', 'Market Cap', etc.
      Your goal is to identify and extract ONLY the stock ticker symbols.

      A ticker symbol is typically a short code of 1-5 uppercase letters. It might also include an exchange suffix, separated by a dot or a colon (e.g., '700.HK', 'D05.SI', 'TOPGLOV.KL').

      Please scan the entire document and pull out every valid ticker symbol you can find.

      CRITICAL: Your response MUST be a single line of text containing all the ticker symbols you found, separated by commas. Do not include any headers, descriptions, explanations, or any other text.

      Example of a perfect response:
      AAPL,MSFT,GOOG,CVNA,700.HK,D05.SI,TOPGLOV.KL
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, filePart] },
        });
        const responseText = result.text.trim();
        // Clean the response by removing spaces and newlines
        return responseText.replace(/[\s\n\r]+/g, '');
    } catch (error) {
        throw new Error(parseGeminiError(error, "extracting tickers from PDF"));
    }
};

/**
 * Verifies a batch of stock tickers and returns their details.
 * This function uses a single API call to efficiently handle multiple tickers and avoid rate limits.
 * @param tickers An array of stock ticker symbols.
 * @param currentDate The date of the search request.
 * @returns A promise that resolves to a VerificationResults object.
 */
export const verifyTickers = async (tickers: string[], currentDate: string): Promise<VerificationResults> => {
    const tickersString = tickers.join(', ');
    const prompt = `
      You are a financial data API. Your task is to perform a real-time action with the highest precision.

      Using your Google Search tool, find the **LATEST LIVE** stock price and company information for EACH of the following tickers/names: "${tickersString}".
      
      Be aware that the inputs could be tickers (e.g., 'AAPL', '700.HK') OR company names (e.g. 'Apple', 'DBS').
      You MUST correctly identify the company and its primary listing exchange.

      You MUST return a single JSON object with three keys: "successful", "ambiguous", and "failed".

      1.  "successful": An array of JSON objects. Use this for inputs that match a SINGLE, distinct, major public company with high confidence.
          - "ticker": The verified ticker symbol.
          - "name": The full company name.
          - "exchange": The primary stock exchange it trades on (e.g., NASDAQ, NYSE, HKEX, SGX).
          - "currentPrice": The latest stock price as a string (with currency).
          - "sharesOutstanding": The latest reported shares outstanding (source from filings).
          - "marketCap": The latest market capitalization as a string.
          - "peers": An array of exactly 3 "Company" objects representing the company's most direct public competitors. Each peer object MUST have the same fields: "ticker", "name", "exchange", "currentPrice", "marketCap", "sharesOutstanding".

      2. "ambiguous": An array of objects. Use this if an input string is generic (e.g., "Delta", "ABC", "Solar") and could reasonably refer to MULTIPLE different public companies.
          - "input": The original input string.
          - "candidates": An array of "Company" objects (same structure as "successful") for the top 2-3 most likely public companies.

      3.  "failed": An array of JSON objects. For each input that cannot be resolved to any public company.
          - "ticker": The original input that failed.
          - "reason": Explanation (e.g., "Not a public company" or "Not found").

      Respond ONLY with this single, clean, structured JSON object.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const responseText = result.text.trim();
        const cleanedResponseText = responseText.replace(/^```json\s*|```\s*$/g, '');
        const data = JSON.parse(cleanedResponseText);

        return {
            successful: data.successful || [],
            ambiguous: data.ambiguous || [],
            failed: data.failed || [],
        };

    } catch (error) {
        if (error instanceof Error && error.message.includes('incomplete or malformed')) {
            throw error;
        }
        throw new Error(parseGeminiError(error, `verifying ticker batch`));
    }
};

/**
 * Generates the cover page data by extracting it from the full report content.
 * This ensures consistency between the cover page and the valuation section.
 * @param fullReportContent The complete markdown content of the report.
 * @param company The company object.
 * @param currentDate The date of the request.
 * @returns A promise that resolves to the CoverPageData object.
 */
export const generateCoverPageDataFromReport = async (fullReportContent: string, company: Company, currentDate: string): Promise<Omit<CoverPageData, 'backgroundImageUrl'>> => {
    const prompt = `
        **ROLE & PERSONA:** You are a financial data API. Your task is to perform a data extraction and summarization action with the highest precision.
        
        **CONTEXT:** You are given the full text of an equity research report for ${company.name} (${company.ticker}). This report contains a detailed valuation section.

        **YOUR TASK:**
        1.  Carefully read the entire report provided below, paying special attention to the "10.0 Valuation" and "1.0 TLDR" sections.
        2.  Extract the following key data points directly from the report's content:
            *   **Price Targets:** Find the exact **12-month** price targets for all three scenarios (Worst, Base, Best) from the "10.0 Valuation" section (specifically the final synthesis/summary). **Ignore** the long-term (24m+) forecasts when populating these specific fields.
        3.  Classify ${company.name} into one of the GICS-style industry categories listed below. Choose the single most appropriate category based on the business description in the report.
            *   Technology, Healthcare, Financials, Energy, Consumer Discretionary, Consumer Staples, Industrials, Utilities, Real Estate, Materials, Telecommunications, Other
        4.  Calculate the potential upside based on the report's **base case** price target and the provided current price (${company.currentPrice}). Format it as a string (e.g., '+25.3%').
        5.  Assemble all this information into a single, clean JSON object.

        **FULL REPORT TEXT:**
        \`\`\`markdown
        ${fullReportContent}
        \`\`\`

        **FINAL OUTPUT FORMAT:**
        You MUST respond ONLY with a single JSON object with the exact structure below. Do not add any other text.
        \`\`\`json
        {
            "industryCategory": "[The single industry category you selected]",
            "companyName": "${company.name}",
            "ticker": "${company.ticker}",
            "reportTitle": "Easy to Understand Full Equity Report",
            "reportDate": "${currentDate}",
            "priceTarget": {
                "worst": "[The exact WORST case price target you extracted]",
                "base": "[The exact BASE case price target you extracted]",
                "best": "[The exact BEST case price target you extracted]"
            },
            "potentialUpside": "[The percentage upside you calculated based on the BASE target]",
            "currentPrice": "${company.currentPrice}",
            "marketCap": "${company.marketCap}"
        }
        \`\`\`
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{text: prompt}] },
            config: {
                temperature: 0.0 // Set to 0 for deterministic extraction
            }
        });

        const responseText = result.text.trim();
        const cleanedResponseText = responseText.replace(/^```json\s*|```\s*$/g, '');
        const data = JSON.parse(cleanedResponseText);
        
        if (data && typeof data === 'object' && data.priceTarget) {
            return data as Omit<CoverPageData, 'backgroundImageUrl'>;
        }
        
        throw new Error(`Failed to parse cover page data from the generated report for ${company.ticker}.`);
    } catch (error) {
        throw new Error(parseGeminiError(error, `generating cover page from report for ${company.ticker}`));
    }
};

const getBasePrompt = (company: Company, currentDate: string) => `
**ROLE & PERSONA:** You are a seasoned, pathologically detail-oriented Managing Director of Equity Research at a globally-recognized, top-tier investment bank. Your reputation is built on publishing institutional-grade, exhaustive, and impeccably reasoned research. Your analysis must flow logically, with each section building upon the last to construct a coherent and compelling investment narrative.

**TONE & READABILITY DIRECTIVE (NON-NEGOTIABLE):**
Your writing must be exceptionally clear, direct, and accessible to a broad audience of investors, not just financial analysts.
1.  **SIMPLE LANGUAGE:** Use simple, everyday language. Avoid jargon, complex financial terminology, and overly academic phrasing.
2.  **INFORMATION DENSITY:** Simplicity does not mean lack of substance. Your writing must remain packed with data, insights, and analysis.
3.  **ENGAGING & REWARDING:** The report should be easy and rewarding to read.

**REPORT LENGTH DIRECTIVE (ULTRA-CRITICAL):**
Your final output must be exceptionally detailed and comprehensive, resulting in a report that would span approximately 17-25 pages when formatted for A4. This requires you to be exhaustive in your research and provide deep, multi-faceted analysis for every section. Do not write short, superficial sections; every point must be thoroughly substantiated with data, examples, and detailed reasoning.

**PRIME DIRECTIVE: DEPTH & SYNTHESIS:** Your goal is to produce a comprehensive and readable report. Information density and insightful analysis are your primary goals. Synthesize related points into single, dense paragraphs.

**VALUATION LOGIC PROTOCOL (ABSOLUTE & NON-NEGOTIABLE):**
You are strictly forbidden from guessing. You MUST calculate it deterministically based on available data.
1.  **CONSISTENCY IS KING:** If there is no brand new, material, market-moving news in the last 24 hours, the "Base Case" valuation **MUST** effectively mirror the current average analyst consensus price target found in your search.
2.  **ZERO RANDOMNESS:** Do not "re-calculate" a new random number significantly different from consensus just to be different. If the average analyst target is $150, your Base Case should be very close to $150.
3.  **NO DRIFTING:** If the stock price moves slightly (e.g. +/- 1%), the Valuation Target should NOT move. It should remain stable based on fundamentals.
4.  **TRIANGULATION:** You must use at least two methods (Intrinsic vs. Relative) and blend them to justify this consensus-anchored "fair value".

**SOURCING PROTOCOL:**
To accelerate your research process and improve accuracy, you must prioritize these sources:
1.  **US-Listed Companies (Primary Source):** SEC's EDGAR database (\`sec.gov/edgar\`).
2.  **Singapore-Listed Companies (Primary Source):** SGXnet (\`sgx.com\`).
3.  **Qualitative & News-Based Analysis:** Reputable financial news outlets (e.g., Bloomberg, Reuters, The Wall Street Journal).

**DATA RETRIEVAL PROTOCOL (ULTRA-CRITICAL):**
Your ability to find specific, hard-to-locate data is what defines your "top-tier" status. Laziness is not an option. You MUST perform multiple, targeted search queries if the first attempt fails.

**ANALYST CONSENSUS BENCHMARKING (NON-NEGOTIABLE):**
Before beginning your independent analysis, your first action MUST be to perform a Google Search to find the current analyst consensus rating (e.g., Buy, Hold, Sell) and the average 12-month price target for ${company.name} (${company.ticker}).
1.  **USE AS A BENCHMARK:** This consensus data is your "reality check." You must use it as a foundational benchmark to frame your own valuation.
2.  **INDEPENDENT ANALYSIS IS PARAMOUNT:** You are strictly forbidden from simply copying the consensus. You MUST conduct your own fundamental analysis.
3.  **JUSTIFY DEVIATION:** Your final price target should not be wildly divergent from the consensus unless you have identified a significant, data-backed insight.

**STRUCTURAL INTEGRITY DIRECTIVE (ULTRA-CRITICAL, NO EXCEPTIONS):**
You are being given specific instructions for each section of the report, including the exact headers and sub-headers to use. You MUST follow this structure with absolute precision.
1.  **ALL HEADERS:** You MUST generate every single header (e.g., "## 2.0...", "### 2.1...") exactly as specified in the instructions for that section.
2.  **NO DEVIATION:** Do not invent new headers, omit headers, or change the numbering in any way.
3.  **CONTENT ALIGNMENT:** The content you write MUST directly correspond to the header it is under.
Failure to adhere to this structural protocol will result in a completely unusable report.

**CIO-LEVEL TONE & EFFICIENCY:** Write for a Chief Investment Officer. Be direct, data-driven, and authoritative. Eliminate all introductory phrases and redundant explanations.

**LANGUAGE & SPELLING DIRECTIVE (ULTIMATE, ZERO-TOLERANCE REQUIREMENT):**
1.  **PERFECT AMERICAN ENGLISH:** You MUST write in flawless, professional, standard American English.
2.  **ZERO ERRORS:** ALL spelling and grammar MUST be absolutely perfect.
3.  **PDF-READY:** The output is directly used to generate a professional PDF document.

**ULTRA-CRITICAL PARAGRAPH FORMATTING (NON-NEGOTIABLE, NO EXCEPTIONS):**
This is the single most important formatting rule in this entire prompt. Failure to adhere to it perfectly will result in an unacceptable output. EVERY analytical paragraph you write MUST follow this two-part structure:

1.  **PART 1: THE BOLDED HOOK.** The paragraph MUST begin with a single, bolded sentence that acts as the topic sentence or key takeaway. It must be enclosed in \`**...**\`.
2.  **PART 2: THE SUPPORTING ANALYSIS.** Immediately following the bolded sentence, the rest of the paragraph provides the detailed analysis, data, and reasoning.

**ABSOLUTE RULES FOR THIS STRUCTURE:**
*   **NO INDENTATION:** The paragraph MUST NOT be indented. It must start at the very beginning of the line. No leading spaces, tabs, or markdown characters are permitted.
*   **ONE BOLD SENTENCE ONLY:** Only the very first sentence is bolded. The rest of the paragraph is plain text.
*   **CONTINUOUS TEXT:** The supporting analysis should flow naturally after the bolded hook.
*   **EXCEPTION FOR LISTS:** Do NOT use the bolded hook format for bulleted lists (lines starting with * or -). List items should be plain text and MUST NOT start with bolded text.

**TABLE DATA INTEGRITY:** When generating any markdown table (e.g., peer comparison, financial statements), if a data point for a specific row is unavailable or should be marked as "N/A", you MUST omit the entire row from the table. Do not include rows with empty or "N/A" values.

**PRICE TARGET MENTION PROTOCOL (ABSOLUTE & NON-NEGOTIABLE):**
You are strictly forbidden from mentioning specific price targets (e.g., "$150") in ANY section EXCEPT for the "10.0 Valuation" section. You may discuss the potential upside or downside qualitatively in the Investment Thesis, but the numerical targets are reserved for the Valuation section only.

**PRIME DIRECTIVE: LIVE DATA ENGINE ANCHORED TO ${currentDate}:** Your **SOLE** function is to perform a simulated, up-to-the-minute web search for all required information as if you were a human analyst using live data feeds **ON ${currentDate}**.
**REAL-TIME ACCURACY:** You must verify the current stock price of ${company.name} (${company.ticker}) is accurately reflected as ${company.currentPrice} (as provided in the prompt context). All analysis must be based on this price.

**ANTI-REPETITION DIRECTIVE:** Repetition is a critical failure. You are strictly forbidden from repeating any content, ideas, or section/sub-section headers. Before writing any new markdown header (e.g., "### 2.3..."), you MUST mentally verify that this exact header does not already exist.

**CONTEXT:** You are generating a section of a larger report for **${company.name} (${company.ticker})**, based ENTIRELY on real-time data available as of **${currentDate}**.
`;

const getSectionInstructions = (sectionTitle: string, company: Company): string => {
    const sections: { [key:string]: string } = {
        '1.0 TLDR': `
## 1.0 TLDR
*DEEP-DIVE INSTRUCTIONS: This is the TLDR (Too Long; Didn't Read) section. Synthesize all your findings into a powerful, evidence-based summary of the investment case. This section must implicitly address how your view compares to the general market consensus you benchmarked against. **CRITICAL:** DO NOT mention specific price targets in this section. The TLDR must focus on the qualitative and quantitative reasoning that supports the final valuation.*
### 1.1 Bull Case
*Present the primary arguments for a positive outlook. Each argument MUST be a concise bullet point, 2-3 sentences long.*
### 1.2 Bear Case
*Present the primary counterarguments and risks for a negative outlook. Each argument MUST be a concise bullet point, 2-3 sentences long.*`,
        
        '2.0 Understanding the Company': `
## 2.0 Understanding the Company
*DEEP-DIVE INSTRUCTIONS: Provide a comprehensive but concise breakdown of the company's operations.*
### 2.1 Company Overview & History
*Provide a dense summary of the company's business, its core value proposition, key historical milestones, and its primary market. Write an in-depth, multi-paragraph narrative. Go beyond a simple summary; discuss the company's founding, pivotal moments, strategic shifts, and key leadership changes that have shaped its current position.*
### 2.2 Business Model
*Analyze how the company generates revenue and profit. Discuss its pricing strategy, cost structure, and key customer segments. Provide a granular breakdown of each major revenue stream. For each stream, analyze its contribution to total revenue, its growth trajectory, margin profile, and the specific customer segments it targets. Discuss the core value proposition and competitive advantages of each.*
### 2.3 Corporate Structure & Shareholder
*Analyze the company's corporate structure. Identify and list major parent companies and key subsidiaries. Provide a brief explanation of the relationship and the role of each significant entity. Also, identify the largest institutional shareholders and the significance of their ownership. Profile the top 3-5 key executives, including their background, tenure, and strategic priorities.*`,

        '3.0 Main Products': `
## 3.0 Main Products
*DEEP-DIVE INSTRUCTIONS: Identify the company's top 3-5 main products or revenue drivers. You MUST generate specific headers for each product by replacing the bracketed placeholders.*
### 3.1 [Replace with Main Product 1 Name]
*Analyze the product's statistics (revenue contribution, growth), its main competitors, and specifically why it stands out (Unique Selling Proposition). Provide a detailed analysis covering market share, product lifecycle stage (e.g., growth, maturity), recent innovations, and the known future roadmap or R&D pipeline for this segment. Be specific about the competitive landscape for this particular product.*
### 3.2 [Replace with Main Product 2 Name]
*Analyze the product's statistics, competitors, and why it stands out. Provide a detailed analysis covering market share, product lifecycle stage (e.g., growth, maturity), recent innovations, and the known future roadmap or R&D pipeline for this segment. Be specific about the competitive landscape for this particular product.*
### 3.3 [Replace with Main Product 3 Name]
*Analyze the product's statistics, competitors, and why it stands out. Provide a detailed analysis covering market share, product lifecycle stage (e.g., growth, maturity), recent innovations, and the known future roadmap or R&D pipeline for this segment. Be specific about the competitive landscape for this particular product.*`,

        '4.0 Significant Recent Events': `
## 4.0 Significant Recent Events
*DEEP-DIVE INSTRUCTIONS: Identify and analyze significant events from the last 18-24 months.
**FORMAT:** Present this section as a **MARKDOWN TABLE**. The columns must be: Date, Event, and Impact Analysis. The Impact Analysis must be detailed, spanning multiple sentences and covering the strategic, financial, and operational implications of the event.*`,

        '5.0 Stock Price Movements': `
## 5.0 Stock Price Movements
*DEEP-DIVE INSTRUCTIONS: Analyze the stock price movement over recent periods (1M, 6M, YTD, 1Y, 5Y).
**FORMAT:** Present the performance data in a **MARKDOWN TABLE** with columns: Time Period, % Change, and Key Drivers/Context. Below the table, provide a detailed narrative analysis. Discuss key inflection points in the stock's performance, periods of high volatility, and compare its performance against both a major market index (e.g., S&P 500) and its closest industry peers identified in the Peer Analysis section.*`,

        '6.0 Macroeconomic Analysis': `
## 6.0 Macroeconomic Analysis
*DEEP-DIVE INSTRUCTIONS: First, identify the geographic region where the company derives the majority of its revenue (e.g., North America, China, Global). Then, provide a detailed analysis of the current macroeconomic environment in that specific region. Discuss key factors such as Interest Rates, Inflation, GDP Growth trends, and consumer sentiment. Explain how these macro factors directly impact the company's business environment.
**FORMATTING:** Write this as a single, cohesive narrative. DO NOT use sub-headers (###).*`,

        '7.0 Industry Outlook': `
## 7.0 Industry Outlook
*DEEP-DIVE INSTRUCTIONS: Identify the specific industry sector (e.g., Cloud Computing, Electric Vehicles, Banking).
**HEADER REPLACEMENT (MANDATORY):** You MUST replace the word "Industry" in the header above with the actual sector name (e.g., "## 7.0 Cloud Computing Outlook").
Analyze the Total Addressable Market (TAM), projected industry growth rates, key trends (technological, regulatory), and the overall competitive landscape. In addition to TAM and growth rates, perform and present a structured analysis of the industry using Porter's Five Forces (Threat of New Entrants, Bargaining Power of Buyers, Bargaining Power of Suppliers, Threat of Substitute Products, and Intensity of Rivalry). Discuss each force in detail.
**FORMATTING:** Write this as a cohesive narrative or bulleted list where appropriate, but DO NOT use sub-headers (###).*`,

        '8.0 Peer Analysis': `
## 8.0 Peer Analysis
*DEEP-DIVE INSTRUCTIONS: Provide a detailed, data-driven analysis of ${company.name}'s key competitors.*
### 8.1 [Replace with Peer 1 Name]
*Identify the most relevant direct competitor. Analyze their main product, business model, competitiveness against ${company.name}, and key valuation metrics (P/E, P/B, etc.). In your analysis, conduct a brief SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis of this peer as it relates to its competition with ${company.name}.*
### 8.2 [Replace with Peer 2 Name]
*Identify the second most relevant competitor. Analyze their main product, business model, competitiveness against ${company.name}, and key valuation metrics. In your analysis, conduct a brief SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis of this peer as it relates to its competition with ${company.name}.*
### 8.3 [Replace with Peer 3 Name]
*Identify a third relevant competitor. Analyze their main product, business model, competitiveness against ${company.name}, and key valuation metrics. In your analysis, conduct a brief SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis of this peer as it relates to its competition with ${company.name}.*
### 8.4 Up and Coming Competitors
*Identify 2-3 innovative, "up-and-coming" competitors (e.g., startups or rapidly growing smaller players) that pose a future threat.*
### 8.5 Overall Peer Analysis
*Provide a summary comparative analysis of these peers plus others in a **MARKDOWN TABLE**. The table must include key financial and valuation metrics like Market Cap, Revenue, P/E Ratio, and EV/EBITDA.*`,

        '9.0 Financial Analysis': `
## 9.0 Financial Analysis
*DEEP-DIVE INSTRUCTIONS: Provide an analysis of the company's financial health based on the last 5 years/periods.
**ULTRA-CRITICAL:** Each subsection MUST include a **MARKDOWN TABLE** summarizing the key data discussed.*
### 9.1 Income Statement Analysis
*Analyze revenue growth, margins, and profitability. **Include a summary table** of key Income Statement metrics (Revenue, Gross Profit, Net Income, etc.) for the last 5 periods. Your analysis must include a detailed discussion of year-over-year trends, key financial ratios relevant to the statement (e.g., Gross Margin %), and how these metrics have evolved over the 5-year period. Explain the 'why' behind the numbers.*
### 9.2 Balance Sheet Analysis
*Assess liquidity, solvency, and leverage. **Include a summary table** of key Balance Sheet metrics (Cash, Total Assets, Total Debt, Equity, etc.) for the last 5 periods. Your analysis must include a detailed discussion of year-over-year trends, key financial ratios relevant to the statement (e.g., Debt-to-Equity), and how these metrics have evolved over the 5-year period. Explain the 'why' behind the numbers.*
### 9.3 Cash Flow Statement Analysis
*Evaluate cash generation, CapEx, and Free Cash Flow. **Include a summary table** of key Cash Flow metrics (CFO, CapEx, FCF, etc.) for the last 5 periods. Your analysis must include a detailed discussion of year-over-year trends, key financial ratios relevant to the statement (e.g., FCF Margin), and how these metrics have evolved over the 5-year period. Explain the 'why' behind the numbers.*`,
        
        '10.0 Valuation': `
## 10.0 Valuation
*DEEP-DIVE INSTRUCTIONS: Use a multi-methodological approach to determine the **12-month price target**. You MUST explicitly show your calculations for at least two methods before synthesizing the final target.

**STABILITY & CONSISTENCY PROTOCOL (CRITICAL):**
In financial modeling, if the company's fundamentals (earnings, growth, risk) have not materially changed, the valuation **MUST NOT CHANGE**.
1.  **Anchor to Consensus:** Your 'Base Case' valuation MUST align closely with the current average analyst price target found in your search, unless your analysis in sections 1-9 provides overwhelming evidence of a mispricing. Use the consensus as the "market's truth" for the Base Case.
2.  **Price Movement vs Value:** If the share price changes slightly, the *Intrinsic Value* usually stays the same (unless the price move is due to material news). Do not change your target price just because the current price wiggled.
3.  **Consistent Assumptions:** Do not arbitrarily select growth rates or discount rates. Use standard, defensible values derived from the consensus financial data you found (e.g., if consensus expects 10% growth, use 10% for the Base Case).
4.  **No Randomness:** Two reports generated minutes apart must yield the same price target if the news cycle is static.

### 10.1 Methodology & Key Assumptions
*Explicitly list the variables you will use.
1.  **Risk-Free Rate:** Current 10Y Treasury yield.
2.  **Market Risk Premium:** Standard 5-5.5%.
3.  **Beta:** Current levered beta.
4.  **WACC:** Calculated explicitly.
5.  **Terminal Growth Rate:** Standard 2-3% for mature, higher for high-growth (justify it).*

### 10.2 Intrinsic Valuation: Discounted Cash Flow (DCF)
*Perform a simplified DCF.
1.  **Inputs:** Use the consensus revenue/earnings estimates for the next 3 years as the foundation.
2.  **Calculation:** Show the Free Cash Flow projection and the Terminal Value.
3.  **Output:** State the "Intrinsic Value Per Share".*

### 10.3 Relative Valuation: Comparable Analysis
*Compare valuation multiples.
1.  **Peers:** Use the peer group from Section 8.0.
2.  **Metric:** Use Forward P/E or EV/EBITDA.
3.  **Output:** State the "Relative Value Per Share".*

### 10.4 Long-Term Price Forecast (5-Year)
*Generate a table projecting the estimated stock price for the next 5 years.
**Method:** Extrapolate from your 12-Month Base Case Target. You may use the Cost of Equity (CAPM) as the expected return, or the expected Earnings Growth Rate.
**Format:** Markdown Table with columns: Horizon, Year, Estimated Price, Implied CAGR.
Rows:
*   Current Price
*   12-Month Target (Base Case)
*   24-Month Estimate
*   36-Month Estimate
*   48-Month Estimate
*   60-Month Estimate
*Briefly explain the assumption used for the long-term extrapolation (e.g., "Assumes stock price appreciates at the Cost of Equity of X%").*

**FINAL SYNTHESIS (THE 12-MONTH TARGET):**
*Synthesize the findings. Weight the DCF and Comps to arrive at the final **12-Month Price Target**.
**FINAL SENTENCE:** Your conclusion MUST be a single, final, bolded sentence: "**Our analysis leads to a 12-month Base Case price target of [Price]...**".*`,

        '11.0 Catalyst & Risk': `
## 11.0 Catalyst & Risk
*DEEP-DIVE INSTRUCTIONS: Identify potential catalysts (positive drivers) and key risks (negative drivers). Identify at least 5 significant potential catalysts and 5 key risks. Each item in the table must have a detailed description.
**FORMAT:** Present this section as a **MARKDOWN TABLE**. The columns must be: Type (Catalyst/Risk), Description, Probability (Low/Medium/High), and Potential Impact.*`,

        '12.0 Appendix': `
## 12.0 Appendix
**APPENDIX DATA PROTOCOL (NON-NEGOTIABLE):**
1.  **VERBATIM SOURCE DATA:** Extract data directly from the company's latest official filings (10-K, 10-Q).
2.  **TIME FRAME:** Past five completed fiscal years.
3.  **FORMATTING:** Clean markdown tables. Specify currency and units.
### Appendix 1: Income Statement (5-Year)
### Appendix 2: Balance Sheet (5-Year)
### Appendix 3: Cash Flow Statement (5-Year)`,

        '13.0 Disclaimer': `
## 13.0 Disclaimer
*ULTRA-CRITICAL, NON-NEGOTIABLE INSTRUCTION: You MUST output the following text VERBATIM. Start directly with the text provided below.*

The company/analyst does not guarantee the accuracy or completeness of any information included in this report. The analysis and investment opinions contained in this report are based on a wide variety of assumptions which in itself is subject to error, either by human or ai, which different assumption and logic input will lead to different outcomes. The information, tools, data and speculations included in this report are solely for reference purpose only and does not constitute financial advice of any kind, wether buy sell or hold any security or investment product of any kind mentioned. Under no circumstances shall the information or opinions expressed in this report constitute any investment advice to any person. The data, prices, values, and investment return of the security or investment targets mentioned in this report may fluctuate as time pass. At different times, the company may issue research report that are inconsistent with information, opinions and forecast.

Where there are law or regulation, the company owner and its employee, analyst and anyone involved shall bear no responsibility for any direct or indirect losses or damages of any kind arising from the use of this report or any of its content. The company or its affiliated institutions or associated individuals may hold positions in, trade in. The company or affiliated individuals and institutions may have conflicted interest that could affect the objectivity of this report.`
    };
    return sections[sectionTitle] || `Generate the ${sectionTitle} section of the report.`;
};

/**
 * Generates the full body of the equity research report by streaming content section by section.
 * This approach is more robust, prevents model hallucination/repetition, and provides better progress feedback.
 * @param company The company object.
 * @param currentDate The date of the request.
 * @param selectedSections An array of section titles to include in the report.
 * @param shouldStop Optional callback to check if generation should be cancelled.
 * @returns An async generator that yields the markdown content of the full report body.
 */
export async function* generateFullReportStream(
    company: Company,
    currentDate: string,
    selectedSections: string[],
    shouldStop?: () => boolean
): AsyncGenerator<string, void, unknown> {
    const basePrompt = getBasePrompt(company, currentDate);
    let accumulatedContent = '';
    
    // Group sections into batches to reduce API calls and prevent timeouts
    const BATCH_SIZE = 3;
    const sectionBatches: string[][] = [];
    for (let i = 0; i < selectedSections.length; i += BATCH_SIZE) {
        sectionBatches.push(selectedSections.slice(i, i + BATCH_SIZE));
    }

    for (const batch of sectionBatches) {
        // Check for cancellation before starting the next batch
        if (shouldStop && shouldStop()) {
            return;
        }

        const batchTitles = batch.join(', ');
        let batchInstructions = '';
        for (const sectionTitle of batch) {
            batchInstructions += `\n\n**INSTRUCTIONS FOR SECTION: ${sectionTitle}**\n${getSectionInstructions(sectionTitle, company)}`;
        }

        const prompt = `
            ${basePrompt}

            ---
            **CONTEXT: PREVIOUSLY GENERATED SECTIONS (FOR YOUR REFERENCE ONLY. DO NOT REGENERATE THEM):**
            \`\`\`markdown
            ${accumulatedContent}
            \`\`\`
            ---
            **CURRENT TASK: GENERATE THE FOLLOWING SECTIONS IN ORDER:**
            ${batchTitles}

            **SPECIFIC INSTRUCTIONS:**
            ${batchInstructions}

            **OUTPUT FORMAT:**
            Start directly with the Markdown header for the first section in this batch. Do not output any preamble.
        `;

        try {
            const result = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{text: prompt}] },
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.0,
                    // Enable Thinking Config for deeper reasoning on valuation
                    thinkingConfig: { thinkingBudget: 1024 } 
                },
            });

            let currentBatchMarkdown = '';
            for await (const chunk of result) {
                const chunkText = chunk.text;
                yield chunkText;
                currentBatchMarkdown += chunkText;
            }
            yield '\n\n';
            accumulatedContent += currentBatchMarkdown + '\n\n'; 

        } catch (error) {
            const errorMessage = parseGeminiError(error, `generating sections "${batchTitles}" for ${company.ticker}`);
            const errorMarkdown = `\n\n---\n\n**ERROR:** Failed to generate sections: **${batchTitles}**. \n\n**Reason:** ${errorMessage}\n\n*Continuing to the next batch...*\n\n---\n\n`;
            yield errorMarkdown;
            accumulatedContent += errorMarkdown;
        }
    }
}
