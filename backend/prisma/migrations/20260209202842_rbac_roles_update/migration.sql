-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "email_verified_at" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'SUBCONTRACTOR',
    "phone" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "bio" TEXT,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" DATETIME,
    "blocked_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("bio", "blocked_at", "blocked_reason", "company", "created_at", "email", "email_verified_at", "id", "is_blocked", "job_title", "name", "password_hash", "phone", "role", "updated_at") SELECT "bio", "blocked_at", "blocked_reason", "company", "created_at", "email", "email_verified_at", "id", "is_blocked", "job_title", "name", "password_hash", "phone", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
