-- Migration 0007: Create gym_equipment table

CREATE TABLE IF NOT EXISTS gym_equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  purchase_date DATE NOT NULL,
  condition VARCHAR(50) DEFAULT 'Good',
  status VARCHAR(50) DEFAULT 'available',
  service_due_month VARCHAR(7),
  under_warranty BOOLEAN DEFAULT FALSE,
  under_maintenance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_equipment_status ON gym_equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON gym_equipment(category);
