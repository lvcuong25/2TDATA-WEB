-- Migration: Create conditional_formatting_rules table
-- Date: 2025-01-04

-- Conditional Formatting Rules Table
CREATE TABLE IF NOT EXISTS conditional_formatting_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL,
    column_id UUID, -- NULL = apply to all columns
    database_id VARCHAR(24) NOT NULL, -- MongoDB ObjectId reference
    
    -- Rule definition
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'cell_value', 'date', 'text_contains', 'formula', 'cross_column'
    )),
    
    -- Conditions (stored as JSONB for flexibility)
    conditions JSONB NOT NULL DEFAULT '[]',
    
    -- Formatting (stored as JSONB)
    formatting JSONB NOT NULL DEFAULT '{}',
    
    -- Priority and status
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Target permissions (similar to existing permission system)
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN (
        'all_members', 'specific_user', 'specific_role'
    )),
    target_user_id VARCHAR(24), -- MongoDB ObjectId
    target_role VARCHAR(20) CHECK (target_role IN ('owner', 'manager', 'member')),
    
    -- Metadata
    created_by VARCHAR(24) NOT NULL, -- MongoDB ObjectId
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_table_id ON conditional_formatting_rules(table_id);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_column_id ON conditional_formatting_rules(column_id);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_database_id ON conditional_formatting_rules(database_id);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_active ON conditional_formatting_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_priority ON conditional_formatting_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_target ON conditional_formatting_rules(target_type, target_user_id, target_role);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_conditions ON conditional_formatting_rules USING GIN(conditions);
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_formatting ON conditional_formatting_rules USING GIN(formatting);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_conditional_formatting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conditional_formatting_updated_at
    BEFORE UPDATE ON conditional_formatting_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_conditional_formatting_updated_at();

-- Add foreign key constraints if tables exist
DO $$
BEGIN
    -- Check if tables table exists and add foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
        ALTER TABLE conditional_formatting_rules 
        ADD CONSTRAINT fk_conditional_formatting_table_id 
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if columns table exists and add foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'columns') THEN
        ALTER TABLE conditional_formatting_rules 
        ADD CONSTRAINT fk_conditional_formatting_column_id 
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE;
    END IF;
END $$;
