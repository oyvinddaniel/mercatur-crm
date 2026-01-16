-- Mercatur CRM - Initial Database Schema
-- Created: 2026-01-16
-- Phase: 4 - MVP Implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
-- Note: We use Supabase Auth (auth.users) for authentication
-- This table stores additional profile information

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT NOT NULL,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_profiles_full_name ON profiles(full_name);
CREATE INDEX idx_profiles_last_login ON profiles(last_login_at DESC);

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Company info
  company_name TEXT NOT NULL,
  org_number TEXT,
  address TEXT,
  industry TEXT,
  website TEXT,
  notes TEXT,

  -- Lifecycle & status
  lifecycle_stage TEXT CHECK (lifecycle_stage IN ('lead', 'prospect', 'customer', 'active', 'former')),
  customer_status TEXT CHECK (customer_status IN ('active', 'inactive', 'potential', 'lost')),
  lead_source TEXT,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),

  -- Finance & follow-up
  annual_revenue NUMERIC(10,2),
  next_contact_date DATE,

  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_org_number ON customers(org_number);
CREATE INDEX idx_customers_is_favorite ON customers(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_customers_updated_at ON customers(updated_at DESC);
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_lifecycle_stage ON customers(lifecycle_stage);
CREATE INDEX idx_customers_customer_status ON customers(customer_status);
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX idx_customers_next_contact_date ON customers(next_contact_date) WHERE next_contact_date IS NOT NULL;

-- Constraints
ALTER TABLE customers ADD CONSTRAINT check_org_number_format
  CHECK (org_number IS NULL OR org_number ~ '^\d{9}$');

ALTER TABLE customers ADD CONSTRAINT check_annual_revenue_positive
  CHECK (annual_revenue IS NULL OR annual_revenue >= 0);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. CONTACTS TABLE
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relation
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Contact info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  notes TEXT,

  -- Professional info
  linkedin_url TEXT,
  department TEXT,
  is_decision_maker BOOLEAN DEFAULT FALSE,

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_primary ON contacts(customer_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_contacts_is_decision_maker ON contacts(customer_id, is_decision_maker) WHERE is_decision_maker = TRUE;
CREATE INDEX idx_contacts_department ON contacts(department);

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all contacts"
  ON contacts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contacts"
  ON contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contacts"
  ON contacts FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 4. COMMUNICATION_LOGS TABLE
-- ============================================

CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  logged_by UUID NOT NULL REFERENCES auth.users(id),

  -- Communication info
  communication_type TEXT NOT NULL CHECK (communication_type IN ('meeting', 'email', 'phone', 'other')),
  communication_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subject TEXT NOT NULL,
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comm_logs_customer_id ON communication_logs(customer_id);
CREATE INDEX idx_comm_logs_contact_id ON communication_logs(contact_id);
CREATE INDEX idx_comm_logs_logged_by ON communication_logs(logged_by);
CREATE INDEX idx_comm_logs_type ON communication_logs(communication_type);
CREATE INDEX idx_comm_logs_date ON communication_logs(communication_date DESC);
CREATE INDEX idx_comm_logs_created_at ON communication_logs(created_at DESC);

-- Constraints
ALTER TABLE communication_logs ADD CONSTRAINT check_communication_date_not_future
  CHECK (communication_date <= NOW());

-- RLS Policies
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all logs"
  ON communication_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create logs"
  ON communication_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own logs"
  ON communication_logs FOR UPDATE
  USING (auth.uid() = logged_by);

CREATE POLICY "Users can delete own logs"
  ON communication_logs FOR DELETE
  USING (auth.uid() = logged_by);

-- ============================================
-- 5. DEALS TABLE
-- ============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),

  -- Deal info
  deal_name TEXT NOT NULL,
  deal_value NUMERIC(10,2),
  currency TEXT DEFAULT 'NOK',

  -- Pipeline
  stage TEXT NOT NULL CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),

  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,

  -- Notes
  lost_reason TEXT,
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX idx_deals_updated_at ON deals(updated_at DESC);

-- Constraints
ALTER TABLE deals ADD CONSTRAINT check_deal_value_positive
  CHECK (deal_value IS NULL OR deal_value >= 0);

-- RLS Policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all deals"
  ON deals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create deals"
  ON deals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update deals"
  ON deals FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete deals"
  ON deals FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comm_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure single primary contact per customer
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE contacts
    SET is_primary = FALSE
    WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_contact_trigger
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();

-- Auto-set deal close date when won/lost
CREATE OR REPLACE FUNCTION set_deal_close_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage IN ('won', 'lost') AND (OLD.stage IS NULL OR OLD.stage NOT IN ('won', 'lost')) THEN
    NEW.actual_close_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_deal_close_date_trigger
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION set_deal_close_date();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW customers_with_stats AS
SELECT
  c.id,
  c.company_name,
  c.org_number,
  c.address,
  c.industry,
  c.website,
  c.notes,
  c.lifecycle_stage,
  c.customer_status,
  c.lead_source,
  c.assigned_to,
  c.annual_revenue,
  c.next_contact_date,
  c.is_favorite,
  c.created_at,
  c.updated_at,

  -- Stats
  COUNT(DISTINCT contacts.id) AS contact_count,
  COUNT(DISTINCT communication_logs.id) AS communication_count,
  COUNT(DISTINCT deals.id) AS deal_count,
  MAX(communication_logs.communication_date) AS last_communication_date,

  -- Primary contact
  (SELECT full_name FROM contacts
   WHERE contacts.customer_id = c.id AND contacts.is_primary = TRUE
   LIMIT 1) AS primary_contact_name

FROM customers c
LEFT JOIN contacts ON contacts.customer_id = c.id
LEFT JOIN communication_logs ON communication_logs.customer_id = c.id
LEFT JOIN deals ON deals.customer_id = c.id
GROUP BY c.id;

-- ============================================
-- COMPLETE
-- ============================================
-- Migration 001 completed successfully
