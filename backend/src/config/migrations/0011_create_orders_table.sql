-- Migration 0011: create orders table

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'orderPlaced',
  payment_status VARCHAR(50) DEFAULT 'pending',
  total NUMERIC(10,2) DEFAULT 0,
  order_type VARCHAR(50),
  shipping JSONB,
  pickup JSONB,
  order_track JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
