-- migration 0002: add products table

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  description TEXT,
  ratings INTEGER DEFAULT 0,
  weight TEXT[],        -- array of strings
  size TEXT[],
  gender TEXT[],
  mrp NUMERIC(10,2) DEFAULT 0,
  offer INTEGER DEFAULT 0,
  offer_price NUMERIC(10,2) DEFAULT 0,
  stock JSONB DEFAULT '{}'::jsonb,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
