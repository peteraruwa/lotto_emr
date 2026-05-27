import type { HmoProvider } from './types';

export const HMO_PROVIDERS: HmoProvider[] = [
  { id: 'nhia',      name: 'National Health Insurance Authority (NHIA)',   shortCode: 'NHIA',    phone: '08000-NHIA',   email: 'info@nhia.gov.ng' },
  { id: 'leadway',   name: 'Leadway Health',                               shortCode: 'LHC',     phone: '0700-LEADWAY', email: 'health@leadway.com' },
  { id: 'hygeia',    name: 'Hygeia HMO',                                   shortCode: 'HYG',     phone: '01-270-2255',  email: 'info@hygeiagroup.com' },
  { id: 'tht',       name: 'Total Health Trust HMO',                       shortCode: 'THT',     phone: '01-279-4100',  email: 'info@tht.ng' },
  { id: 'avon',      name: 'Avon Medical',                                 shortCode: 'AVON',    phone: '01-791-1550',  email: 'info@avonhealthcare.com' },
  { id: 'redcare',   name: 'Redcare HMO',                                  shortCode: 'RCH',     phone: '09-461-4600',  email: 'info@redcarehmo.com' },
  { id: 'reliance',  name: 'Reliance HMO',                                 shortCode: 'RELI',    phone: '0700-RELIANCE', email: 'support@reliancehmo.com' },
  { id: 'clearline', name: 'Clearline International HMO',                  shortCode: 'CLR',     phone: '01-271-6020',  email: 'info@clearlinehmo.com' },
  { id: 'aiico',     name: 'AIICO Multishield',                            shortCode: 'AIICO',   phone: '01-284-6009',  email: 'health@aiico.com.ng' },
  { id: 'mediplan',  name: 'MediPlan Healthcare',                          shortCode: 'MPC',     phone: '01-614-3960',  email: 'info@mediplan.com.ng' },
  { id: 'equity',    name: 'Equity HMO',                                   shortCode: 'EQH',     phone: '01-454-6900',  email: 'info@equityhmo.com' },
  { id: 'greenbay',  name: 'Greenbay Healthcare',                          shortCode: 'GBH',     phone: '09-461-4700',  email: 'info@greenbayhealthcare.com' },
  { id: 'phiz',      name: 'PHC/PHIZ HMO',                                 shortCode: 'PHIZ',    phone: '01-278-8020',  email: 'info@phizcare.com' },
  { id: 'nonsovereign', name: 'Non-Sovereign Entity (Private)',            shortCode: 'PRIV',    },
  { id: 'other',     name: 'Other / Not Listed',                           shortCode: 'OTH',     },
];

export const BILLING_STATUS_LABELS: Record<string, string> = {
  init:                'Pending',
  verified:            'Verified',
  invoiced:            'Invoiced',
  paid:                'Paid',
  hmo_approved:        'HMO Approved',
  closed:              'Closed',
  emergency_deferred:  'Emergency — Deferred',
  reconciled:          'Reconciling',
  denied:              'Denied',
};

export const BILLING_STATUS_COLORS: Record<string, string> = {
  init:                'bg-gray-100 text-gray-700',
  verified:            'bg-blue-100 text-blue-700',
  invoiced:            'bg-indigo-100 text-indigo-700',
  paid:                'bg-green-100 text-green-700',
  hmo_approved:        'bg-teal-100 text-teal-700',
  closed:              'bg-gray-200 text-gray-600',
  emergency_deferred:  'bg-red-100 text-red-700',
  reconciled:          'bg-orange-100 text-orange-700',
  denied:              'bg-red-100 text-red-800',
};
