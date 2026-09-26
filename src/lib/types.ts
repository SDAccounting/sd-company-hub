// Role tiers mirror Double's existing permission model (superAdmin /
// practiceAdmin / manager / practiceEmployee) collapsed to three tiers,
// since the Hub doesn't need to distinguish superAdmin vs practiceAdmin yet.
export type StaffRole = "admin" | "manager" | "staff";

export type ClientStatus = "lead" | "active" | "inactive" | "archived";

export interface Staff {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

export interface ModuleAccessGrant {
  staff_id: string;
  module_key: string;
  granted_at: string;
  granted_by: string | null;
}

export interface Client {
  id: string;
  legal_name: string;
  display_name: string;
  status: ClientStatus;
  entity_type: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  cra_business_number: string | null;
  hst_number: string | null;
  payroll_account_number: string | null;
  wsib_number: string | null;
  eht_number: string | null;
  year_end: string | null; // stored as MM-DD
  accounting_software: string | null;
  qbo_realm_id: string | null;
  billing_rate: number | null;
  billing_frequency: string | null;
  reporting_frequency: string | null;
  primary_staff_id: string | null;
  close_checklist_template_id: string | null;
  runs_payroll: boolean;
  payroll_frequency: string | null;
  payroll_platform: string | null;
  sop_url: string | null;
  sop_content: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaxType =
  | "hst"
  | "hst_instalment"
  | "wsib"
  | "eht"
  | "payroll_remittance"
  | "corporate_instalment"
  | "qpp"
  | "other";

export interface ClientTaxAccount {
  id: string;
  client_id: string;
  tax_type: TaxType;
  account_number: string | null;
  frequency: string | null;
  filing_months: string[] | null;
  we_pay: boolean;
  notes: string | null;
  created_at: string;
}

export type AccountKind = "bank" | "credit_card" | "loc" | "loan";

export interface ClientFinancialAccount {
  id: string;
  client_id: string;
  kind: AccountKind;
  name: string;
  institution: string | null;
  last4: string | null;
  active: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export type TaskStatus = "open" | "done";

export interface Task {
  id: string;
  client_id: string | null;
  title: string;
  status: TaskStatus;
  assigned_staff_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type CloseStatus = "not_started" | "in_progress" | "done";

export interface ClientClose {
  id: string;
  client_id: string;
  month_date: string; // always the 1st of the month
  status: CloseStatus;
  preparer_staff_id: string | null;
  reviewer_staff_id: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CloseChecklistItem {
  id: string;
  close_id: string;
  phase: string;
  title: string;
  sort_order: number;
  is_done: boolean;
  done_by: string | null;
  done_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CloseChecklistTemplate {
  id: string;
  name: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

export interface CloseChecklistTemplateItem {
  id: string;
  template_id: string;
  phase: string;
  title: string;
  sort_order: number;
}
