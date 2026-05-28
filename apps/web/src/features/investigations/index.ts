export { InvestigationsDashboard } from './components/investigations-dashboard';
export { useInvestigationOrders, useCompletedOrders, useUpdateOrderStatus } from './hooks/use-investigation-orders';
export { useRecordLabResult } from './hooks/use-record-lab-result';
export { useRecordRadiologyReport } from './hooks/use-record-radiology-report';
export type {
  InvDept,
  InvOrder,
  OrderStatus,
  OrderPriority,
  RejectionReason,
  LabBench,
  ImagingModality,
  LabResultEntry,
  RecordedLabResult,
  RadiologyReport,
  CriticalAlert,
  SpecimenRecord,
  ShiftHandoverEntry,
  InvAnalytics,
} from './types';
export {
  REJECTION_REASONS,
  LAB_BENCH_LABELS,
  LAB_BENCH_COLORS,
  IMAGING_MODALITY_LABELS,
  IMAGING_MODALITY_COLORS,
  LAB_PANELS,
  RADIOLOGY_TEMPLATES,
  SPECIMEN_TYPES,
  BENCH_CATEGORIES,
} from './constants';
