export type CDSIndicator = 'info' | 'warning' | 'critical';

export interface CDSLink {
  label: string;
  url: string;
  type: 'absolute' | 'smart';
}

export interface CDSSuggestion {
  label: string;
  uuid: string;
  actions?: Array<{
    type: 'create' | 'update' | 'delete';
    description: string;
  }>;
}

export interface CDSCard {
  uuid: string;
  summary: string;
  detail?: string;
  indicator: CDSIndicator;
  source: {
    label: string;
    url?: string;
  };
  links?: CDSLink[];
  suggestions?: CDSSuggestion[];
}

export interface CDSHookResponse {
  cards: CDSCard[];
}
