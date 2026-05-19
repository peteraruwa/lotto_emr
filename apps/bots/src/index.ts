// Bot handler exports
// Each bot handler is a named export matching its Medplum bot entry point.

export { handler as patientViewCDS } from './cds-hooks/patient-view/handler';
export { handler as orderSelectCDS } from './cds-hooks/order-select/handler';
export { handler as orderSignCDS } from './cds-hooks/order-sign/handler';

export { handler as noteDraftAI } from './ai/handlers/note-draft/handler';
export { handler as summarizeHistoryAI } from './ai/handlers/summarize-history/handler';
export { handler as differentialSuggestAI } from './ai/handlers/differential-suggest/handler';

export { handler as onPatientCreate } from './automations/on-patient-create/handler';
export { handler as onObservationCreate } from './automations/on-observation-create/handler';
