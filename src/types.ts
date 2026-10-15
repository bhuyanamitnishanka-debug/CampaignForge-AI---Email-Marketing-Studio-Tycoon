export type CampaignObjective = 
  | 'flash_sale'
  | 'product_launch'
  | 'newsletter'
  | 'welcome_sequence'
  | 're_engagement'
  | 'webinar_invite'
  | 'case_study';

export type BrandTone = 
  | 'persuasive'
  | 'urgent'
  | 'conversational'
  | 'authoritative'
  | 'luxury'
  | 'playful';

export interface SubjectLine {
  id: string;
  text: string;
  angle: 'curiosity' | 'urgency' | 'benefit' | 'social_proof' | 'how_to';
  spamScore: number; // 0 to 100 (lower is better)
  predictedOpenRate: number; // percentage, e.g. 38.5%
  isRecommended?: boolean;
}

export interface BenefitBullet {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CtaButton {
  text: string;
  url: string;
  style: 'primary' | 'dark' | 'outline' | 'pill';
  secondaryText?: string;
}

export interface CampaignVisual {
  prompt: string;
  aspectRatio: '16:9' | '1:1' | '4:3' | '9:16';
  imageSize: '1K' | '2K' | '4K';
  imageUrl: string | null;
  altText: string;
  headlineOverlay?: string;
  placement: 'header' | 'middle' | 'card';
}

export interface EmailCampaign {
  id: string;
  title: string;
  objective: CampaignObjective;
  targetAudience: string;
  brandTone: BrandTone;
  prompt: string;
  createdAt: number;
  
  // Subject & Preview
  subjectLines: SubjectLine[];
  selectedSubjectIndex: number;
  previewText: string;
  
  // Body Content
  eyebrow: string;
  headline: string;
  subheadline: string;
  introHook: string;
  benefits: BenefitBullet[];
  highlightQuote: {
    quote: string;
    author: string;
    role: string;
  };
  cta: CtaButton;
  urgencyBanner?: string;
  footerCompliance: {
    companyName: string;
    physicalAddress: string;
    unsubscribeNotice: string;
  };
  
  // Visual asset
  visual: CampaignVisual;

  // Tracking & Analytics
  tracking?: TrackingConfig;
}

export interface TrackingConfig {
  enableUtm: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  enableTrackingPixel: boolean;
  pixelEndpoint?: string;
}

export type CopilotRole = 'director' | 'copywriter' | 'auditor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  suggestedAction?: {
    type: 'replace_subject' | 'replace_headline' | 'replace_cta' | 'replace_preview';
    payload: string;
    label: string;
  };
}
