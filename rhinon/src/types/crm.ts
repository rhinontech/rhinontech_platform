export interface Lead {
  id: string;

  firstName: string;
  lastName: string;
  name: string;
  avatar: string;

  email: string;
  phone: string;
  linkedinUrl: string;

  company: string;
  companySize: string;
  industry: string;
  companyLocation: string;

  // ---- BACKEND IDs ----
  companyId?: number | null;
  contactId?: number | null;

  // ---- EXTRA FIELDS USED IN UI / CUSTOM_FIELDS ----
  domain?: string;
  website?: string;
  jobTitle?: string;

  status: string;
  pipeline: string;

  priority: Priority;
  dealValue: number;
  currency: string;
  leadScore: number;
  probability: number;

  source: string;
  channels: Channel[];

  lastActivityAt: Date;
  nextFollowupAt: Date;

  custom_fields?: Record<string, any>;
  custom_data?: Record<string, any>;

  tags: string[];
  createdAt: Date;
}

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type Channel =
  | "Email"
  | "Phone"
  | "LinkedIn"
  | "In-Person"
  | "Chat"
  | "Website";

export interface StatusColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  leads: Lead[];
}

export interface Pipeline {
  id: string;
  name: string;
  statuses: string[];
  columns?: StatusColumn[];
}

// Backend payload types
export interface PersonPayload {
  full_name: string;
  emails: string[];
  phones: string[];
  company_id: number | null;
  job_title?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  pipeline_id: number | null;
  pipeline_stage_id: number | null;
}

export interface CompanyPayload {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  pipeline_id: number | null;
  pipeline_stage_id: number | null;
}

export interface DealPayload {
  title: string;
  contact_id: number | null;
  company_id: number | null;
  status?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  sort_order: number;
  pipeline_id: number | null;
  pipeline_stage_id: number | null;
}
