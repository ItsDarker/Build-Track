-- Add DeviceToken table for Remember Me functionality
CREATE TABLE IF NOT EXISTS "device_tokens" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "device_name" VARCHAR(255) NOT NULL,
  "device_fingerprint" VARCHAR(255) NOT NULL,
  "user_agent" TEXT NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "device_token" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Add indexes
CREATE UNIQUE INDEX "device_tokens_device_fingerprint_key" ON "device_tokens"("device_fingerprint");
CREATE UNIQUE INDEX "device_tokens_device_token_key" ON "device_tokens"("device_token");
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");
CREATE INDEX "device_tokens_device_fingerprint_idx" ON "device_tokens"("device_fingerprint");
