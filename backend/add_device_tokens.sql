-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL UNIQUE,
  user_agent TEXT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  device_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_device_fingerprint (device_fingerprint)
);
