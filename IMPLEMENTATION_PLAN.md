# Hospital EMR Complete Refactor - Master Implementation Plan

## Phase 1: CRITICAL FIXES

### 1. Registration Button
- Fix Register Patient button everywhere
- Ensure reliable operation
- Create unique patientID and MRN on submit
- Save full biodata
- Trigger billing automatically

### 2. Billing Workflow
- After registration: Auto-generate BillingItem
- Type: REGISTRATION
- Amount: ₦5,000 (configurable)
- Status: PENDING
- Assigned to patient

### 3. Queue Logic
- Patient enters Today's Queue ONLY after:
  - Payment confirmed
  - Receipt generated
- Create QueueEntry with paymentConfirmed=true

### 4. Receipt Generation
- Auto-generate on payment confirmation
- Unique receipt number: RCP-{timestamp}-{random}
- Reference number: REF-{date}-{random}
- Link to patient and encounter
- Assign cashier/user

### 5. Sidebar Routing Bug
- Fix cross-highlighting issue
- Ensure correct routing to pages
- Active state matches current route
- Highlight only current page

---

## Phase 2: CORE SYSTEMS

### 6. Patient Dataset (50 Complete Records)
- File: apps/web/src/data/complete-patient-dataset.ts
- Exactly 50 patients with full data
- Demographics, vitals, allergies, medications, diagnoses
- Immunizations, family planning, ANC, admissions, discharge, death cert

### 7. Clinical Modules
- Immunization module with records
- Allergies with severity levels
- Drug alerts and interactions
- Family planning records
- ANC records for pregnant women
- Admission and discharge records
- Death certificates
- Medical reports

### 8. Alerts System
- Role-based visibility (clinical staff only)
- Allergy alerts: Penicillin, Latex, Sulfa
- Drug interaction alerts during prescribing
- Severity-based color coding

### 9. NIN Logic Update
- Verified status
- Pending verification status
- Not verified (default if no NIN)
- Foreign patient (non-Nigerian + no NIN)
- Never treat missing NIN as error

---

## Phase 3: UI/UX REFINEMENT

### 10. Button Alignment
- Icon + text inline (no wrapping)
- Centered alignment
- Consistent 8px spacing
- Uniform sizing across app

### 11. Navigation Fixes
- Fix sidebar routing bug
- Add language selector (flag + name)
- Fix on-duty panel alignment
- Consistent nav styling

### 12. Print Functionality
- Add to all clinical documents
- Consultation notes, progress notes, admission notes
- Discharge summaries, medical reports
- ANC records, immunization records
- Prescriptions, procedure notes
- Placement: Top-right actions bar

### 13. Scrollbar Removal
- Hide scrollbars visually
- Sidebars, clinic tools panel, dropdown panels
- Keep overflow: auto functionality
- Professional appearance

### 14. Layout Consistency
- Unify colors, spacing, typography
- Design system tokens
- Professional hospital-grade UI
- High readability
- WCAG AA contrast compliance

---

## Phase 4: FINAL POLISH

### 15. Branding
- Login screen: Logo (left) + Hospital Name (right)
- Hero credit: "By Dr. Peter" only
- About button: Single line, no wrapping

### 16. Design System
- Colors: Medical Blue, Green (success), Red (alert), Orange (warning), Gray (neutral)
- Spacing: 8px grid (XS 4px, S 8px, M 16px, L 24px, XL 32px)
- Typography: Consistent sizing and weights

### 17. Performance
- Optimize queries
- Implement caching
- Page load < 2 seconds

### 18. Testing
- Unit tests for RBAC
- Integration tests for workflows
- E2E tests for patient journey
- No console errors

### 19. Documentation
- API documentation
- User guide
- Architecture diagrams

---

## Patient Registration Workflow

Register → Auto-Billing → Payment → Receipt → Queue Entry

---

## NIN Status Logic

- With NIN: Verified | Pending | Not Verified
- No NIN (Nigerian): Not Verified
- No NIN (Foreign): Foreign Patient
- Never treat as error

---

## RBAC Permissions

Only RECORDS_STAFF can verify/edit NIN. All others: read-only access.

---

## Success Criteria

Production-grade hospital EMR with real workflow integrity, accurate billing, clinical alerts, and clean professional UI.
