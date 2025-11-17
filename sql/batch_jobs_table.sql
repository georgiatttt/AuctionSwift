-- Create batch_jobs table for tracking OpenAI Batch API jobs
CREATE TABLE IF NOT EXISTS batch_jobs (
    batch_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    total_items INTEGER NOT NULL,
    input_file_id TEXT NOT NULL,
    output_file_id TEXT,
    error_file_id TEXT,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    metadata JSONB
);

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read batch jobs
CREATE POLICY "Anyone can view batch jobs" ON batch_jobs
    FOR SELECT USING (true);

-- Policy: Anyone can insert batch jobs
CREATE POLICY "Anyone can create batch jobs" ON batch_jobs
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update batch jobs
CREATE POLICY "Anyone can update batch jobs" ON batch_jobs
    FOR UPDATE USING (true);
