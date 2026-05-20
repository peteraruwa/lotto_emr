export interface Employee {
  id: string;
  staffId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  systemRole: string;
  loginEmail: string;
  phone?: string;
  dateOfEmployment: string;
  active: boolean;
}
