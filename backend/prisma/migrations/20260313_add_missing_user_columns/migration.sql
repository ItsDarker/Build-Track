-- AddMissingColumns to users table
ALTER TABLE "users" 
ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT,
ADD COLUMN "display_name" TEXT,
ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "user_type" TEXT,
ADD COLUMN "user_status" TEXT DEFAULT 'Active';
