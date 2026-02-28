-- Migration 0003: create detailed gym_members table

CREATE TABLE IF NOT EXISTS gym_members (
  id SERIAL PRIMARY KEY,
  member_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  gender VARCHAR(20),
  height NUMERIC(5,2),
  weight NUMERIC(5,2),
  bmi NUMERIC(5,2),
  plan VARCHAR(100),
  duration INTEGER,
  join_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  photo TEXT,
  notes TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_members_phone ON gym_members(phone);
CREATE INDEX IF NOT EXISTS idx_gym_members_member_id ON gym_members(member_id);
