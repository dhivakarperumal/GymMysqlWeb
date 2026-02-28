-- Migration 0004: create gym_plans table

CREATE TABLE IF NOT EXISTS gym_plans (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0,
  final_price NUMERIC(10,2),
  facilities JSONB DEFAULT '[]',
  trainer_included BOOLEAN DEFAULT false,
  diet_plans JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_plans_plan_id ON gym_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_gym_plans_active ON gym_plans(active);
