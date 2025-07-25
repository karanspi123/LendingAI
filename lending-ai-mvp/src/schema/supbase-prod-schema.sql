-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simple types for MVP
CREATE TYPE document_type AS ENUM ('pay_stub', 'bank_statement', 'tax_return', 'id_document', 'employment_letter', 'other');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE loan_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'declined');

-- Simple loan applications table
CREATE TABLE loan_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  borrower_name VARCHAR(255) NOT NULL,
  borrower_email VARCHAR(255),
  loan_amount DECIMAL(12,2),
  property_address TEXT,
  status loan_status DEFAULT 'draft',
  
  -- AI results
  ai_risk_score INTEGER,
  ai_risk_level VARCHAR(20),
  ai_analysis JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple documents table
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  vision_api_data JSONB,
  processing_status processing_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Basic indexes
CREATE INDEX idx_documents_loan_id ON documents(loan_application_id);
CREATE INDEX idx_documents_status ON documents(processing_status);

-- Insert demo loan for testing
INSERT INTO loan_applications (
  id, 
  borrower_name, 
  borrower_email, 
  loan_amount, 
  property_address, 
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Michael & Jennifer Martinez',
  'michael.martinez@email.com',
  380000,
  '2847 Willow Creek Dr, Frisco, TX 75034',
  'draft'
);
