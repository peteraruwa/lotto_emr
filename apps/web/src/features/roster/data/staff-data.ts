// Staff registry — SerialQuest EMR roster module.
// 48 staff members across 6 departments (HR excluded).

export type Department = 'doctors' | 'nurses' | 'lab' | 'pharmacy' | 'radiology' | 'records';
export type Ward = 'opd' | 'ae' | 'female';
export type Shift = 'morning' | 'night';

export interface StaffMember {
  id: string;       // e.g. "D001"
  name: string;     // e.g. "Dr. Chukwuemeka Okafor"
  role: string;     // e.g. "Medical Officer"
  phone: string;    // Nigerian format e.g. "0803-456-7890"
  department: Department;
  ward?: Ward;      // only for doctors and nurses
}

export const DEPT_META: Record<Department, {
  label: string; shortLabel: string;
  iconBg: string; iconText: string;
  badgeBg: string; badgeText: string;
}> = {
  doctors:   { label: 'Doctors',         shortLabel: 'Doctors',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   badgeBg: 'bg-blue-50',   badgeText: 'text-blue-700'   },
  nurses:    { label: 'Nurses',          shortLabel: 'Nurses',    iconBg: 'bg-green-100',  iconText: 'text-green-600',  badgeBg: 'bg-green-50',  badgeText: 'text-green-700'  },
  lab:       { label: 'Laboratory',      shortLabel: 'Lab',       iconBg: 'bg-purple-100', iconText: 'text-purple-600', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700' },
  pharmacy:  { label: 'Pharmacy',        shortLabel: 'pharmacy',  iconBg: 'bg-orange-100', iconText: 'text-orange-600', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700' },
  radiology: { label: 'Radiology',       shortLabel: 'Radiology', iconBg: 'bg-cyan-100',   iconText: 'text-cyan-600',   badgeBg: 'bg-cyan-50',   badgeText: 'text-cyan-700'   },
  records:   { label: 'Medical Records', shortLabel: 'Records',   iconBg: 'bg-gray-100',   iconText: 'text-gray-600',   badgeBg: 'bg-gray-100',  badgeText: 'text-gray-700'   },
};

export const WARD_META: Record<Ward, { label: string; shortLabel: string }> = {
  opd:    { label: 'OPD',             shortLabel: 'OPD'    },
  ae:     { label: 'A&E / Male Ward', shortLabel: 'A&E'    },
  female: { label: 'Female Ward',     shortLabel: 'Female' },
};

export const SHIFT_META: Record<Shift, {
  label: string; time: string;
  bg: string; text: string; border: string; dot: string;
}> = {
  morning: { label: 'Morning', time: '9:00 AM – 5:00 PM', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  night:   { label: 'Night',   time: '5:00 PM – 9:00 AM', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-400' },
};

export const STAFF: StaffMember[] = [
  // ─── Doctors – OPD (D001–D004) ───────────────────────────────────────────────
  { id: 'D001', name: 'Dr. Chukwuemeka Okafor',    role: 'Medical Officer',     phone: '0802-341-8821', department: 'doctors', ward: 'opd'    },
  { id: 'D002', name: 'Dr. Adaeze Nwosu',           role: 'Medical Officer',     phone: '0802-453-7732', department: 'doctors', ward: 'opd'    },
  { id: 'D003', name: 'Dr. Babatunde Adeyemi',      role: 'Medical Officer',     phone: '0802-564-6643', department: 'doctors', ward: 'opd'    },
  { id: 'D004', name: 'Dr. Ngozi Eze',              role: 'Senior Med. Officer', phone: '0802-675-5554', department: 'doctors', ward: 'opd'    },
  // ─── Doctors – A&E / Male Ward (D005–D008) ───────────────────────────────────
  { id: 'D005', name: 'Dr. Oluwaseun Abiodun',      role: 'Medical Officer',     phone: '0802-786-4465', department: 'doctors', ward: 'ae'     },
  { id: 'D006', name: 'Dr. Ifeoma Okonkwo',         role: 'Medical Officer',     phone: '0802-897-3376', department: 'doctors', ward: 'ae'     },
  { id: 'D007', name: 'Dr. Uche Nwachukwu',         role: 'Medical Officer',     phone: '0802-908-2287', department: 'doctors', ward: 'ae'     },
  { id: 'D008', name: 'Dr. Kemi Adeyemi',           role: 'Senior Med. Officer', phone: '0802-019-1198', department: 'doctors', ward: 'ae'     },
  // ─── Doctors – Female Ward (D009–D012) ───────────────────────────────────────
  { id: 'D009', name: 'Dr. Chioma Obi',             role: 'Medical Officer',     phone: '0803-132-9901', department: 'doctors', ward: 'female' },
  { id: 'D010', name: 'Dr. Tunde Fashola',          role: 'Medical Officer',     phone: '0803-243-8812', department: 'doctors', ward: 'female' },
  { id: 'D011', name: 'Dr. Amaka Obiora',           role: 'Medical Officer',     phone: '0803-354-7723', department: 'doctors', ward: 'female' },
  { id: 'D012', name: 'Dr. Seun Oduola',            role: 'Senior Med. Officer', phone: '0803-465-6634', department: 'doctors', ward: 'female' },
  // ─── Nurses – OPD (N001–N004) ────────────────────────────────────────────────
  { id: 'N001', name: 'Sr. Yetunde Afolabi',        role: 'Staff Nurse',         phone: '0805-111-2233', department: 'nurses',  ward: 'opd'    },
  { id: 'N002', name: 'Sr. Blessing Nwofor',        role: 'Staff Nurse',         phone: '0805-222-3344', department: 'nurses',  ward: 'opd'    },
  { id: 'N003', name: 'Sr. Funmilayo Adekunle',     role: 'Staff Nurse',         phone: '0805-333-4455', department: 'nurses',  ward: 'opd'    },
  { id: 'N004', name: 'Sr. Chinwe Ugwu',            role: 'Senior Nurse',        phone: '0805-444-5566', department: 'nurses',  ward: 'opd'    },
  // ─── Nurses – A&E / Male Ward (N005–N008) ────────────────────────────────────
  { id: 'N005', name: 'Bro. Emeka Onwuegbu',        role: 'Staff Nurse',         phone: '0805-555-6677', department: 'nurses',  ward: 'ae'     },
  { id: 'N006', name: 'Sr. Taiwo Oyelaran',         role: 'Staff Nurse',         phone: '0805-666-7788', department: 'nurses',  ward: 'ae'     },
  { id: 'N007', name: 'Bro. Ifeanyi Chukwu',        role: 'Staff Nurse',         phone: '0805-777-8899', department: 'nurses',  ward: 'ae'     },
  { id: 'N008', name: 'Sr. Sola Lawal',             role: 'Senior Nurse',        phone: '0805-888-9900', department: 'nurses',  ward: 'ae'     },
  // ─── Nurses – Female Ward (N009–N012) ────────────────────────────────────────
  { id: 'N009', name: 'Sr. Adaora Nzelu',           role: 'Midwife / Nurse',     phone: '0806-111-2233', department: 'nurses',  ward: 'female' },
  { id: 'N010', name: 'Sr. Titilayo Adesanya',      role: 'Midwife / Nurse',     phone: '0806-222-3344', department: 'nurses',  ward: 'female' },
  { id: 'N011', name: 'Sr. Chidinma Okeke',         role: 'Midwife / Nurse',     phone: '0806-333-4455', department: 'nurses',  ward: 'female' },
  { id: 'N012', name: 'Sr. Folake Akintola',        role: 'Senior Midwife',      phone: '0806-444-5566', department: 'nurses',  ward: 'female' },
  // ─── Laboratory (L001–L004) ──────────────────────────────────────────────────
  { id: 'L001', name: 'Mr. Obinna Uzoma',           role: 'Lab Technologist',    phone: '0808-121-3434', department: 'lab'      },
  { id: 'L002', name: 'Ms. Chiamaka Dike',          role: 'Lab Technologist',    phone: '0808-232-4545', department: 'lab'      },
  { id: 'L003', name: 'Mr. Kayode Osei',            role: 'Lab Technician',      phone: '0808-343-5656', department: 'lab'      },
  { id: 'L004', name: 'Ms. Nneka Orji',             role: 'Lab Technician',      phone: '0808-454-6767', department: 'lab'      },
  // ─── Pharmacy (P001–P004) ────────────────────────────────────────────────────
  { id: 'P001', name: 'Mr. Rotimi Amaechi',         role: 'Pharmacist',          phone: '0703-131-4242', department: 'pharmacy' },
  { id: 'P002', name: 'Ms. Bolanle Abiodun',        role: 'Pharmacist',          phone: '0703-242-5353', department: 'pharmacy' },
  { id: 'P003', name: 'Mr. Chidi Nwachukwu',        role: 'Pharmacy Technician', phone: '0703-353-6464', department: 'pharmacy' },
  { id: 'P004', name: 'Ms. Temitope Okafor',        role: 'Pharmacy Technician', phone: '0703-464-7575', department: 'pharmacy' },
  // ─── Radiology (R001–R004) ───────────────────────────────────────────────────
  { id: 'R001', name: 'Mr. Wale Okonkwo',           role: 'Radiographer',        phone: '0706-161-5252', department: 'radiology' },
  { id: 'R002', name: 'Ms. Ijeoma Ezike',           role: 'Radiographer',        phone: '0706-272-6363', department: 'radiology' },
  { id: 'R003', name: 'Mr. Lanre Adegoke',          role: 'Radiographer',        phone: '0706-383-7474', department: 'radiology' },
  { id: 'R004', name: 'Ms. Oluwakemi Bello',        role: 'Sonographer',         phone: '0706-494-8585', department: 'radiology' },
  // ─── Medical Records (M001–M004) ─────────────────────────────────────────────
  { id: 'M001', name: 'Ms. Adunola Hassan',         role: 'Records Officer',     phone: '0907-171-6161', department: 'records'  },
  { id: 'M002', name: 'Mr. Nnamdi Eze',             role: 'Records Officer',     phone: '0907-282-7272', department: 'records'  },
  { id: 'M003', name: 'Ms. Olabisi Musa',           role: 'Records Clerk',       phone: '0907-393-8383', department: 'records'  },
  { id: 'M004', name: 'Mr. Ikenna Aliyu',           role: 'Records Clerk',       phone: '0907-404-9494', department: 'records'  },
  // ─── Extra Doctors – cross-coverage / on-call pool (D013–D016) ───────────────
  { id: 'D013', name: 'Dr. Gbenga Adesanya',        role: 'Medical Officer',     phone: '0813-511-2211', department: 'doctors', ward: 'opd'    },
  { id: 'D014', name: 'Dr. Toyin Lawal',            role: 'Medical Officer',     phone: '0813-622-3322', department: 'doctors', ward: 'ae'     },
  { id: 'D015', name: 'Dr. Jide Ibrahim',           role: 'Medical Officer',     phone: '0813-733-4433', department: 'doctors', ward: 'female' },
  { id: 'D016', name: 'Dr. Aisha Mohammed',         role: 'Senior Med. Officer', phone: '0813-844-5544', department: 'doctors', ward: 'opd'    },
  // ─── Extra Nurses – cross-coverage / on-call pool (N013–N016) ────────────────
  { id: 'N013', name: 'Sr. Grace Usman',            role: 'Staff Nurse',         phone: '0813-955-6655', department: 'nurses',  ward: 'ae'     },
  { id: 'N014', name: 'Bro. Sunday Garba',          role: 'Staff Nurse',         phone: '0813-066-7766', department: 'nurses',  ward: 'female' },
  { id: 'N015', name: 'Sr. Patience Aliyu',         role: 'Senior Nurse',        phone: '0813-177-8877', department: 'nurses',  ward: 'opd'    },
  { id: 'N016', name: 'Sr. Victoria Bello',         role: 'Staff Nurse',         phone: '0813-288-9988', department: 'nurses',  ward: 'ae'     },
  // ─── Extra Lab (L005–L006) ───────────────────────────────────────────────────
  { id: 'L005', name: 'Mr. Femi Adeyemi',           role: 'Lab Technician',      phone: '0809-341-5511', department: 'lab'      },
  { id: 'L006', name: 'Ms. Ngozi Nwosu',            role: 'Lab Technician',      phone: '0809-452-6622', department: 'lab'      },
  // ─── Extra Pharmacy (P005–P006) ──────────────────────────────────────────────
  { id: 'P005', name: 'Ms. Abimbola Oduola',        role: 'Pharmacist',          phone: '0709-341-7733', department: 'pharmacy' },
  { id: 'P006', name: 'Mr. Tunde Osei',             role: 'Pharmacy Technician', phone: '0709-452-8844', department: 'pharmacy' },
];
