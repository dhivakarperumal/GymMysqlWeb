-- Migration 0001: create initial database tables

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  manager_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- insert default branch if none exists (idempotent)
INSERT INTO branches (name, location, phone, email, manager_name)
SELECT 'Main Branch', 'City Center', '+91-XXX-XXX-XXXX', 'main@gym.com', 'Manager Name'
WHERE NOT EXISTS (SELECT 1 FROM branches); 

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id),
  membership_plan_id INTEGER,
  join_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id),
  specialization TEXT,
  hire_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_days INTEGER
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  check_in TIMESTAMP DEFAULT NOW(),
  check_out TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  method VARCHAR(50)
);
