-- Migration 0009: create services table

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  short_desc TEXT,
  description TEXT,
  hero_image TEXT,
  points TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_service_id ON services(service_id);
