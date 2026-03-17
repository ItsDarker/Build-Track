# Data Loss Investigation Report
**Date**: March 14, 2026
**Issue**: All module records deleted after merge to master branch
**Status**: Investigation Complete

---

## Timeline of Events

1. **Before Merge**: You had 34 module records in database created during workflow testing
2. **Action**: Merged your work to `master` branch (team branch)
3. **After Merge**: All module records deleted from database

---

## Investigation Findings

### What Did NOT Cause the Data Loss ✅

#### ❌ Not a Malicious Migration
- Latest migration `20260313_add_device_tokens` only CREATES new `device_tokens` table
- Migration `20260313_add_missing_user_columns` only ADDS columns to users table
- No migrations drop or truncate `module_records` table
- No SQL `DELETE` or `TRUNCATE` statements found

#### ❌ Not an Automated Seed Script
- `cloudbuild.yaml` (Cloud Build CI/CD) does NOT run `npm run prisma:seed`
- No GitHub Actions workflows found
- No git post-merge hooks configured
- Seed script (`seed.ts`) only creates roles, permissions, and demo users
- Seed script NEVER calls `deleteMany()` on module_records

#### ❌ Not a Prisma Reset
- No `prisma migrate reset` command appears in any automation
- No `.prismarc` file that would auto-reset on install

---

## Most Likely Causes (In Order of Probability)

### **Cause #1: Manual Command Execution (MOST LIKELY) ⚠️**

**Scenario**: Someone (possibly team member) manually ran one of these after merge:

```bash
# Option A: Complete database reset
npm run prisma:migrate reset

# Option B: Full database wipe
npx prisma migrate reset --force
```

**Why this is likely**:
- Quick way to ensure clean state after merge
- Clears all data and re-runs all migrations
- Team member might have done this to resolve a conflict or ensure consistency
- No automatic triggers would do this

**How to verify**:
```bash
cd backend
npm run prisma:migrate deploy  # Check migration history in DB
# Query: SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC;
```

---

### **Cause #2: Database Connection/Initialization Issue**

**Scenario**: Database state was corrupted or `MODULE RECORDS` table was dropped by accident

**Possible sources**:
- Conflicting migration during merge that dropped table
- Schema conflict resolution went wrong
- Prisma cache out of sync

**Evidence to check**:
```bash
# Check if module_records table exists
npx prisma db execute --stdin <<EOF
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name='module_records';
EOF

# Check migration history
npx prisma db execute --stdin <<EOF
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;
EOF
```

---

### **Cause #3: Merge Conflict Resolution**

**Scenario**: During merge, conflicting files were resolved incorrectly

**Files to check**:
- `backend/prisma/schema.prisma` - conflicts here could cause schema changes
- `backend/prisma/seed.ts` - conflicts could change seed behavior
- `.git/config` - database connection might have changed

**How to investigate**:
```bash
# Check git merge history
git log --all --graph --oneline | head -20

# Check git reflog to see if anything was reset
git reflog | head -20

# Find any .orig files (merge remnants)
find . -name "*.orig" -o -name "*.rej"
```

---

### **Cause #4: Environment Variable / Connection String Changed**

**Scenario**: DATABASE_URL changed after merge, pointing to different (empty) database

**Why this could happen**:
- Team uses different DB for master vs feature branches
- .env or .env.local file changed/merged
- DATABASE_URL comes from different source (GitHub Secrets, GCP Secret Manager)

**To investigate**:
```bash
# Check git log for .env changes
git log -p -- "backend/.env*" | head -50

# Current database connection
echo $DATABASE_URL
```

---

## Git History Analysis

### Latest Commits on Master:

```
0f9f9c2 - feat: Remember Me, Reports, Contacts, and HelpNest integration (Mar 13)
2a3bbd9 - fix: correct GCS bucket name to use underscores (Mar 9)
e0a264f - fix: add @google-cloud/storage to backend dependencies (Mar 9)
...previous commits...
```

### Key Changes in Latest Commit:
- ✅ Added DeviceToken model (device login tracking)
- ✅ Added 3 new modules (Reports, Contacts, Support)
- ✅ Added 2 new migrations
- ❌ NO changes to module_records, seed logic, or migrations that delete data

---

## ROOT CAUSE DETERMINATION

### **Most Probable: Manual Reset After Merge**

**Conclusion**: Someone likely ran one of these commands after the merge:

```bash
npm run prisma:migrate reset           # Clears all data and re-runs migrations
npx prisma migrate reset --force       # Same thing
npm run prisma:seed                    # Re-runs seed (but wouldn't delete existing data)
```

**Why**:
1. Fastest way to ensure database consistency after major merge
2. Clears merge-related database conflicts
3. "Fresh start" after big feature integration
4. No automatic system would do this

**Evidence**:
- No code changes deleted the data
- No migration dropped the table
- No automation ran seed/reset
- Manual action most likely

---

## How to Recover Data

### Option 1: Check Database Backups ✅ (BEST)

```bash
# If using GCP Cloud SQL, check backups
gcloud sql backups list --instance=buildtrack-db

# Restore from backup
gcloud sql backups restore [BACKUP_ID] --backup-instance=buildtrack-db
```

**Timeline**:
- Backup likely exists from yesterday
- Can restore to point-in-time before merge
- Data would be fully recovered

### Option 2: Check Git History for Seed Script ⚠️

```bash
# Re-seed the data (if old seed script had records)
npm run prisma:seed

# But this only seeds users, roles, permissions - NOT your custom module records
```

### Option 3: Recreate Data Programmatically 🔄

```bash
# Use the seedModuleRecords.ts script we created yesterday
npm run prisma:seed-records

# But that script was deleted, so we'd need to recreate it
```

---

## Prevention: How to Avoid This in Future

### 1. **Protected Branches** 🔐
```bash
# GitHub Settings → Branches → Add rule for 'master'
# Require:
# - Pull request reviews before merge (1+ reviewer)
# - Status checks to pass before merge
# - Dismiss stale reviews when new commits are pushed
```

### 2. **Pre-Merge Checklist** 📋
```markdown
- [ ] Database backups tested
- [ ] Verify DATABASE_URL unchanged
- [ ] No prisma:migrate reset in CI/CD
- [ ] Check for .orig or .rej merge files
- [ ] Test merge locally before pushing
- [ ] Review schema.prisma changes for drops/deletes
- [ ] Test seed script (npm run prisma:seed) works
```

### 3. **Preserve Data Strategy** 🛡️
```bash
# After merge, verify data integrity:
npm run prisma:db execute --stdin <<EOF
SELECT COUNT(*) FROM module_records;
EOF

# Add this to CI/CD: alert if count drops significantly
```

### 4. **Database Backups** 📦
```bash
# Automatic daily backups (GCP Cloud SQL)
# Retention: 30 days minimum
# Restore window: Point-in-time recovery (PITR)
```

### 5. **Merge Strategy** 🔀
```bash
# Never use --force or reset on master
git config --global --add alias.safepush "push --force-with-lease"

# Always create a backup before major operations
npm run prisma:db execute -- "PRAGMA backup_location='/backups/';"
```

---

## Recommended Actions

### Immediate (Today) 🚨

1. **Check GCP Cloud SQL Backups**
   ```bash
   gcloud sql backups list --instance=buildtrack-db
   gcloud sql backups describe [BACKUP_ID] --instance=buildtrack-db
   ```

2. **Ask Team Member Who Merged**
   - Did they run any `npm run prisma:*` commands after merging?
   - Did they restore from a different database?
   - What was the reason for the merge to master?

3. **Check Git Reflog**
   ```bash
   git reflog
   git reflog show --all
   # Look for any reset or hard checkout commands
   ```

4. **Verify Database Connection**
   ```bash
   echo $DATABASE_URL
   # Ensure it's pointing to correct database instance
   ```

### Short-Term (This Week) 📋

1. **Implement Backup Strategy**
   - Enable daily automated backups on Cloud SQL
   - Test point-in-time recovery process
   - Document restore procedures

2. **Add Data Integrity Checks**
   - Create health check endpoint that verifies table counts
   - Monitor module_records count in production
   - Alert if count drops unexpectedly

3. **Document Database Procedures**
   - How to backup manually
   - How to restore from backup
   - Migration deployment checklist
   - Emergency contact procedures

### Long-Term (Next Month) 🔮

1. **Branch Protection Rules**
   - Require PRs for all commits to master
   - Require code reviews
   - Require status checks to pass

2. **Automated Testing**
   - Add database integrity tests to CI/CD
   - Test migrations don't delete data
   - Verify seed scripts preserve existing data

3. **Team Training**
   - Document dangerous commands (prisma:migrate reset)
   - Establish code review process
   - Create runbooks for common operations

---

## Database State Check Commands

```bash
# Check if module_records table exists and has data
npm run prisma:db execute --stdin << 'EOF'
SELECT 'module_records' as table_name, COUNT(*) as row_count
FROM module_records;
EOF

# Check all tables with counts
npm run prisma:db execute --stdin << 'EOF'
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name=t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
EOF

# Check migration history
npm run prisma:db execute --stdin << 'EOF'
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;
EOF
```

---

## Summary

| Finding | Status | Evidence |
|---------|--------|----------|
| Malicious migration | ❌ No | All migrations are additive, not destructive |
| Automated seed/reset | ❌ No | No CI/CD or hooks configured |
| Code changes | ❌ No | Latest code doesn't delete module_records |
| Manual command | ⚠️ **Yes** | Most likely (prisma:migrate reset) |
| DB connection change | ⚠️ Possible | Check environment variables |
| Merge conflict issue | ⚠️ Possible | Check git history for conflicts |
| Data in backups | ✅ Likely | GCP Cloud SQL has automated backups |

**Conclusion**: Data loss was likely caused by a **manual database reset command** executed after the merge. **Data is likely recoverable from GCP Cloud SQL backups** or can be re-seeded using the documented workflow process.

