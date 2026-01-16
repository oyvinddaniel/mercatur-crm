// Database types for Mercatur CRM
// Generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer
        Insert: CustomerInsert
        Update: CustomerUpdate
      }
      contacts: {
        Row: Contact
        Insert: ContactInsert
        Update: ContactUpdate
      }
      communication_logs: {
        Row: CommunicationLog
        Insert: CommunicationLogInsert
        Update: CommunicationLogUpdate
      }
      deals: {
        Row: Deal
        Insert: DealInsert
        Update: DealUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
    }
  }
}

// Customer Types
export interface Customer {
  id: string
  company_name: string
  org_number: string | null
  address: string | null
  industry: string | null
  website: string | null
  notes: string | null
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'active' | 'former'
  customer_status: 'active' | 'inactive' | 'potential' | 'lost'
  lead_source: string | null
  assigned_to: string | null
  annual_revenue: number | null
  next_contact_date: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

// Customer with stats (from customers_with_stats view)
export interface CustomerWithStats extends Customer {
  contact_count: number
  deal_count: number
  communication_count: number
  last_communication_date: string | null
  primary_contact_name: string | null
}

export interface CustomerInsert {
  id?: string
  company_name: string
  org_number?: string | null
  address?: string | null
  industry?: string | null
  website?: string | null
  notes?: string | null
  lifecycle_stage?: 'lead' | 'prospect' | 'customer' | 'active' | 'former'
  customer_status?: 'active' | 'inactive' | 'potential' | 'lost'
  lead_source?: string | null
  assigned_to?: string | null
  annual_revenue?: number | null
  next_contact_date?: string | null
  created_by: string
  updated_by: string
}

export interface CustomerUpdate {
  company_name?: string
  org_number?: string | null
  address?: string | null
  industry?: string | null
  website?: string | null
  notes?: string | null
  lifecycle_stage?: 'lead' | 'prospect' | 'customer' | 'active' | 'former'
  customer_status?: 'active' | 'inactive' | 'potential' | 'lost'
  lead_source?: string | null
  assigned_to?: string | null
  annual_revenue?: number | null
  next_contact_date?: string | null
  updated_by: string
}

// Contact Types
export interface Contact {
  id: string
  customer_id: string
  full_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  is_primary: boolean
  linkedin_url: string | null
  department: string | null
  is_decision_maker: boolean
  notes: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export interface ContactInsert {
  id?: string
  customer_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  is_primary?: boolean
  linkedin_url?: string | null
  department?: string | null
  is_decision_maker?: boolean
  notes?: string | null
  created_by: string
  updated_by: string
}

export interface ContactUpdate {
  full_name?: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  is_primary?: boolean
  linkedin_url?: string | null
  department?: string | null
  is_decision_maker?: boolean
  notes?: string | null
  updated_by: string
}

// Communication Log Types
export interface CommunicationLog {
  id: string
  customer_id: string
  contact_id: string | null
  communication_type: 'meeting' | 'email' | 'phone' | 'other'
  communication_date: string
  subject: string
  description: string | null
  logged_by: string
  created_at: string
  updated_at: string
}

export interface CommunicationLogInsert {
  id?: string
  customer_id: string
  contact_id?: string | null
  communication_type: 'meeting' | 'email' | 'phone' | 'other'
  communication_date: string
  subject: string
  description?: string | null
  logged_by: string
}

export interface CommunicationLogUpdate {
  communication_type?: 'meeting' | 'email' | 'phone' | 'other'
  communication_date?: string
  subject?: string
  description?: string | null
}

// Deal Types
export interface Deal {
  id: string
  customer_id: string
  deal_name: string
  deal_value: number
  currency: string
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  assigned_to: string | null
  notes: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export interface DealInsert {
  id?: string
  customer_id: string
  deal_name: string
  deal_value: number
  currency?: string
  stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  assigned_to?: string | null
  notes?: string | null
  created_by: string
  updated_by: string
}

export interface DealUpdate {
  deal_name?: string
  deal_value?: number
  currency?: string
  stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  assigned_to?: string | null
  notes?: string | null
  updated_by: string
}

// Profile Types
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  role?: 'admin' | 'user'
}

export interface ProfileUpdate {
  full_name?: string | null
  avatar_url?: string | null
  role?: 'admin' | 'user'
}
