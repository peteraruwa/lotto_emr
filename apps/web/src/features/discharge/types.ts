export type DispositionType = 'discharge' | 'admit' | 'followup' | 'refer';

export interface DispositionData {
  type: DispositionType;
  summary: string;
  instructions: string;
  followupDate?: string;
  referralDestination?: string;
  admitReason?: string;
}
