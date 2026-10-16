export type WebsiteType = 'NONE' | 'SOCIAL_MEDIA' | 'CUSTOM_WEBSITE';

export type LeadStatus =
  | 'NUEVO'
  | 'ANALIZADO'
  | 'CONTACTADO'
  | 'RESPONDIO'
  | 'REUNION'
  | 'CLIENTE'
  | 'DESCARTADO';

export type OutreachTone = 'DIRECT' | 'CONSULTIVE' | 'DISRUPTIVE';

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  type: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface WebAuditChecklist {
  hasHttps: boolean;
  isMobileFriendly: boolean;
  hasWhatsApp: boolean;
  hasBooking: boolean;
  hasContactForm: boolean;
  copyrightYear?: number;
  isOutdated: boolean;
}

export interface PainPoint {
  issue: string;
  impact: string;
}

export interface WebAuditData {
  pageSpeedScores?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  screenshotBase64?: string;
  analysis: {
    summary: string;
    checklist: WebAuditChecklist;
    extractedEmails: string[];
    extractedSocials: string[];
    painPoints: PainPoint[];
    suggestedService: 'WEB_DEVELOPMENT' | 'WHATSAPP_AGENT' | 'BOOKING_SYSTEM' | 'TRADING_BOT';
    serviceJustification: string;
  };
  outreachDrafts: {
    whatsapp: string;
    callScript: string;
    email: {
      subject: string;
      body: string;
    };
  };
  auditedAt: string;
}

export interface BusinessLead {
  id: string; // Google Place ID
  name: string;
  category: string;
  formattedAddress: string;
  location?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  internationalPhone?: string;
  websiteUri?: string;
  websiteType: WebsiteType;
  socialNetworkDetected?: string; // 'Facebook' | 'Instagram' | 'TikTok' | 'Linktree' | etc.
  googleRating: number;
  userRatingCount: number;
  googleMapsUrl: string;
  businessStatus: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  isSpanishTarget: boolean;
  spanishConfidence?: 'high' | 'medium' | 'low';

  // Scoring
  preliminaryScore: number;
  definitiveScore?: number;
  scoreBreakdown: ScoreBreakdownItem[];

  // Web audit
  webAudit?: WebAuditData;

  // CRM
  status: LeadStatus;
  notes: string;
  nextFollowUpDate?: string;
  savedAt?: string;
  updatedAt?: string;
}

export interface SearchCacheEntry {
  cacheKey: string;
  query: string;
  region: string;
  country: string;
  results: BusinessLead[];
  nextPageToken?: string;
  timestamp: number;
}

export interface SellerProfile {
  fullName: string;
  brandName: string;
  onchainTrackRecordUrl: string;
  clanName: string;
  clanScore: number;
  volumeGenerated: string;
  globalRank: string;
  zapsCount: number;
  primaryServices: string[];
  investorProgramTitle: string;
  specialIncentives: string;
  defaultTone: OutreachTone;
}

export interface AppSettings {
  googleCloudApiKey: string;
  geminiApiKey?: string;
  placesApiQuotaLimit: number; // por defecto 800 aviso, 1000 máximo
  placesApiCallCountThisMonth: number;
  lastQuotaResetDate: string;
  sellerProfile: SellerProfile;
}

export interface NicheOpportunityStat {
  category: string;
  totalFound: number;
  withoutWebsiteCount: number;
  withoutWebsitePercent: number;
  socialOnlyCount: number;
  socialOnlyPercent: number;
  averageRating: number;
  averageReviews: number;
  opportunityRating: number; // 0-100
  recommendedService: string;
  estimatedPlacesCalls: number;
}

export interface NicheRadarResult {
  zone: string;
  country: string;
  stats: NicheOpportunityStat[];
  top3Recommendation?: {
    category: string;
    why: string;
    serviceToSell: string;
  }[];
  geminiExecutiveSummary?: string;
  analyzedAt: string;
}
