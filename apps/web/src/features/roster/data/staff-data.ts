// Staff registry for Lotto Central Hospital roster module.
// 48 staff members across 6 departments (HR excluded).

export type Department = 'doctors' | 'nurses' | 'lab' | 'pharmacy' | 'radiology' | 'records';
export type Ward = 'opd' | 'ae' | 'female';
export type Shift = 'morning' | 'night';

export interface StaffMember {
  id: string;       // e.g. "D001"
  name: string;     // e.g. "Dr. Kwame Mensah"
  role: string;     // e.g. "Medical Officer"
  phone: string;    // e.g. "0244-123-456" (Ghana format)
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
  pharmacy:  { label: 'Pharmacy',        shortLabel: 'Pharmacy',  iconBg: 'bg-orange-100', iconText: 'text-orange-600', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700' },
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
  { id: 'D001', name: 'Dr. Kwame Mensah',        role: 'Medical Officer',     phone: '0244-123-456', department: 'doctors', ward: 'opd'    },
  { id: 'D002', name: 'Dr. Ama Darko',            role: 'Medical Officer',     phone: '0244-234-567', department: 'doctors', ward: 'opd'    },
  { id: 'D003', name: 'Dr. Kofi Asante',          role: 'Medical Officer',     phone: '0244-345-678', department: 'doctors', ward: 'opd'    },
  { id: 'D004', name: 'Dr. Abena Boateng',        role: 'Senior Med. Officer', phone: '0244-456-789', department: 'doctors', ward: 'opd'    },
  // ─── Doctors – A&E / Male Ward (D005–D008) ───────────────────────────────────
  { id: 'D005', name: 'Dr. Yaw Owusu',            role: 'Medical Officer',     phone: '0244-567-890', department: 'doctors', ward: 'ae'     },
  { id: 'D006', name: 'Dr. Akosua Amoah',         role: 'Medical Officer',     phone: '0244-678-901', department: 'doctors', ward: 'ae'     },
  { id: 'D007', name: 'Dr. Nana Adjei',           role: 'Medical Officer',     phone: '0244-789-012', department: 'doctors', ward: 'ae'     },
  { id: 'D008', name: 'Dr. Efua Sarpong',         role: 'Senior Med. Officer', phone: '0244-890-123', department: 'doctors', ward: 'ae'     },
  // ─── Doctors – Female Ward (D009–D012) ───────────────────────────────────────
  { id: 'D009', name: 'Dr. Abena Kyei',           role: 'Medical Officer',     phone: '0244-901-234', department: 'doctors', ward: 'female' },
  { id: 'D010', name: 'Dr. Kwesi Poku',           role: 'Medical Officer',     phone: '0244-012-345', department: 'doctors', ward: 'female' },
  { id: 'D011', name: 'Dr. Esi Quartey',          role: 'Medical Officer',     phone: '0245-123-456', department: 'doctors', ward: 'female' },
  { id: 'D012', name: 'Dr. Kojo Frimpong',        role: 'Senior Med. Officer', phone: '0245-234-567', department: 'doctors', ward: 'female' },
  // ─── Nurses – OPD (N001–N004) ────────────────────────────────────────────────
  { id: 'N001', name: 'Sr. Adwoa Boahene',        role: 'Staff Nurse',         phone: '0245-345-678', department: 'nurses',  ward: 'opd'    },
  { id: 'N002', name: 'Sr. Akua Frimpong',        role: 'Staff Nurse',         phone: '0245-456-789', department: 'nurses',  ward: 'opd'    },
  { id: 'N003', name: 'Sr. Ama Asante',           role: 'Staff Nurse',         phone: '0245-567-890', department: 'nurses',  ward: 'opd'    },
  { id: 'N004', name: 'Sr. Yaa Owusu-Mensa',     role: 'Senior Nurse',        phone: '0245-678-901', department: 'nurses',  ward: 'opd'    },
  // ─── Nurses – A&E / Male Ward (N005–N008) ────────────────────────────────────
  { id: 'N005', name: 'Bro. Kojo Amoah',         role: 'Staff Nurse',         phone: '0245-789-012', department: 'nurses',  ward: 'ae'     },
  { id: 'N006', name: 'Sr. Abena Darko',          role: 'Staff Nurse',         phone: '0245-890-123', department: 'nurses',  ward: 'ae'     },
  { id: 'N007', name: 'Bro. Kofi Adjei',         role: 'Staff Nurse',         phone: '0245-901-234', department: 'nurses',  ward: 'ae'     },
  { id: 'N008', name: 'Sr. Esi Sarpong',          role: 'Senior Nurse',        phone: '0245-012-345', department: 'nurses',  ward: 'ae'     },
  // ─── Nurses – Female Ward (N009–N012) ────────────────────────────────────────
  { id: 'N009', name: 'Sr. Akosua Mensah',        role: 'Midwife / Nurse',     phone: '0246-123-456', department: 'nurses',  ward: 'female' },
  { id: 'N010', name: 'Sr. Adwoa Boateng',        role: 'Midwife / Nurse',     phone: '0246-234-567', department: 'nurses',  ward: 'female' },
  { id: 'N011', name: 'Sr. Ama Kyei',             role: 'Midwife / Nurse',     phone: '0246-345-678', department: 'nurses',  ward: 'female' },
  { id: 'N012', name: 'Sr. Efua Poku-Asante',    role: 'Senior Midwife',      phone: '0246-456-789', department: 'nurses',  ward: 'female' },
  // ─── Laboratory (L001–L004) ──────────────────────────────────────────────────
  { id: 'L001', name: 'Mr. Kofi Asamoah',         role: 'Lab Technologist',    phone: '0246-567-890', department: 'lab'      },
  { id: 'L002', name: 'Ms. Ama Kyei-Baffour',    role: 'Lab Technologist',    phone: '0246-678-901', department: 'lab'      },
  { id: 'L003', name: 'Mr. Yaw Frimpong',         role: 'Lab Technician',      phone: '0246-789-012', department: 'lab'      },
  { id: 'L004', name: 'Ms. Akua Asante',          role: 'Lab Technician',      phone: '0246-890-123', department: 'lab'      },
  // ─── Pharmacy (P001–P004) ────────────────────────────────────────────────────
  { id: 'P001', name: 'Mr. Kwame Mensah-Adu',    role: 'Pharmacist',          phone: '0246-901-234', department: 'pharmacy' },
  { id: 'P002', name: 'Ms. Abena Boateng',        role: 'Pharmacist',          phone: '0246-012-345', department: 'pharmacy' },
  { id: 'P003', name: 'Mr. Kojo Owusu',           role: 'Pharmacy Technician', phone: '0247-123-456', department: 'pharmacy' },
  { id: 'P004', name: 'Ms. Esi Adjei-Mensah',    role: 'Pharmacy Technician', phone: '0247-234-567', department: 'pharmacy' },
  // ─── Radiology (R001–R004) ───────────────────────────────────────────────────
  { id: 'R001', name: 'Mr. Nana Asante',          role: 'Radiographer',        phone: '0247-345-678', department: 'radiology' },
  { id: 'R002', name: 'Ms. Efua Darko',           role: 'Radiographer',        phone: '0247-456-789', department: 'radiology' },
  { id: 'R003', name: 'Mr. Yaw Sarpong',          role: 'Radiographer',        phone: '0247-567-890', department: 'radiology' },
  { id: 'R004', name: 'Ms. Akosua Poku',          role: 'Sonographer',         phone: '0247-678-901', department: 'radiology' },
  // ─── Medical Records (M001–M004) ─────────────────────────────────────────────
  { id: 'M001', name: 'Ms. Adwoa Kyei',           role: 'Records Officer',     phone: '0247-789-012', department: 'records'  },
  { id: 'M002', name: 'Mr. Kofi Quartey',         role: 'Records Officer',     phone: '0247-890-123', department: 'records'  },
  { id: 'M003', name: 'Ms. Ama Frimpong',         role: 'Records Clerk',       phone: '0247-901-234', department: 'records'  },
  { id: 'M004', name: 'Mr. Kwesi Mensah',         role: 'Records Clerk',       phone: '0247-012-345', department: 'records'  },
  // ─── Extra Doctors – cross-coverage / on-call pool (D013–D016) ───────────────
  { id: 'D013', name: 'Dr. Obeng Acheampong',     role: 'Medical Officer',     phone: '0548-111-222', department: 'doctors', ward: 'opd'    },
  { id: 'D014', name: 'Dr. Serwaah Bonsu',        role: 'Medical Officer',     phone: '0548-222-333', department: 'doctors', ward: 'ae'     },
  { id: 'D015', name: 'Dr. Fiifi Tetteh',         role: 'Medical Officer',     phone: '0548-333-444', department: 'doctors', ward: 'female' },
  { id: 'D016', name: 'Dr. Abenaa Twumasi',       role: 'Senior Med. Officer', phone: '0548-444-555', department: 'doctors', ward: 'opd'    },
  // ─── Extra Nurses – cross-coverage / on-call pool (N013–N016) ────────────────
  { id: 'N013', name: 'Sr. Mavis Asiedu',         role: 'Staff Nurse',         phone: '0548-555-666', department: 'nurses',  ward: 'ae'     },
  { id: 'N014', name: 'Bro. Kwabena Appiah',      role: 'Staff Nurse',         phone: '0548-666-777', department: 'nurses',  ward: 'female' },
  { id: 'N015', name: 'Sr. Naana Aidoo',          role: 'Senior Nurse',        phone: '0548-777-888', department: 'nurses',  ward: 'opd'    },
  { id: 'N016', name: 'Sr. Akua Boamah',          role: 'Staff Nurse',         phone: '0548-888-999', department: 'nurses',  ward: 'ae'     },
  // ─── Extra Lab (L005–L006) ───────────────────────────────────────────────────
  { id: 'L005', name: 'Mr. Kweku Duah',           role: 'Lab Technician',      phone: '0549-111-222', department: 'lab'      },
  { id: 'L006', name: 'Ms. Abena Owusu',          role: 'Lab Technician',      phone: '0549-222-333', department: 'lab'      },
  // ─── Extra Pharmacy (P005–P006) ──────────────────────────────────────────────
  { id: 'P005', name: 'Ms. Esi Agyeman',          role: 'Pharmacist',          phone: '0549-333-444', department: 'pharmacy' },
  { id: 'P006', name: 'Mr. Kofi Danso',           role: 'Pharmacy Technician', phone: '0549-444-555', department: 'pharmacy' },
];
