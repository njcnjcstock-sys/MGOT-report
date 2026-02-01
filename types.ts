
export interface Company {
  ticker: string;
  name: string;
  exchange: string;
  currentPrice: string;
  sharesOutstanding: string;
  marketCap: string;
  peers?: Company[];
}

export interface ReportHistoryItem {
  id: number;
  ticker: string;
  companyName: string;
  date: string;
  reportContent: string;
}

export interface Report {
  id: number;
  coverPageData: CoverPageData;
  reportContent: string;
}

export interface CoverPageData {
  backgroundImageUrl: string | null;
  companyName: string;
  ticker: string;
  reportTitle: string;
  reportDate: string;
  priceTarget: {
    worst: string;
    base: string;
    best: string;
  };
  potentialUpside: string;
  currentPrice: string;
  marketCap: string;
  industryCategory?: string;
}

export type Theme = 'default' | 'classic' | 'slate' | 'graphite' | 'crimson' | 'emerald' | 'ocean' | 'sunrise' | 'paper' | 'forest' | 'royal' | 'industrial' | 'quantum';

export interface VerificationResults {
  successful: Company[];
  ambiguous: { input: string; candidates: Company[] }[];
  failed: { ticker: string; reason: string }[];
}

export interface ReportPageData {
  title: string;
  content: string;
}

export interface StoryResult {
  imageUrl: string;
  story: string;
}
