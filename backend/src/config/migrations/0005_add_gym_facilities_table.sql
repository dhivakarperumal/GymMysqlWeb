-- Migration 0005: create gym_facilities table

CREATE TABLE IF NOT EXISTS gym_facilities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  short_description VARCHAR(255),
  description TEXT,
  hero_image TEXT,
  equipments JSONB DEFAULT '[]',
  workouts JSONB DEFAULT '[]',
  facilities JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_facilities_slug ON gym_facilities(slug);
