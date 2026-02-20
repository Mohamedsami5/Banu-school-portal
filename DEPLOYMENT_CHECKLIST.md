# Deployment Checklist - Multiple Teacher Assignments Fix

## Pre-Deployment

### Verification Checklist
- [ ] Read `IMPLEMENTATION_SUMMARY.md` for overview
- [ ] Reviewed `TEACHERS_MULTIPLE_ASSIGNMENTS.md` for full documentation
- [ ] Reviewed `API_REFERENCE.md` for endpoint changes
- [ ] Understand the MongoDB cleanup required (see `CLEANUP_MONGODB.md`)

### Code Review Checklist
- [ ] Reviewed `backend/models/Teacher.js` changes (subject field removed)
- [ ] Reviewed `backend/server.js` changes (new endpoints added)
- [ ] Reviewed `src/components/TeachersTable.jsx` changes (display logic)
- [ ] Reviewed `src/pages/ManageTeachers.jsx` changes (modal display)
- [ ] All syntax appears correct (no obvious errors)

## Pre-Deployment Steps

### 1. Backup Database
```bash
cd your-project-directory
mongodump --uri "mongodb://127.0.0.1:27017/BANUSchool" --out ./mongodump_backup

# Verify backup
ls -la mongodump_backup/BANUSchool
# Should see "teachers.bson" file
```
- [ ] MongoDB backup created successfully
- [ ] Backup file size > 0 KB

### 2. Install Dependencies (if needed)
```bash
# Backend
cd backend
npm install  # Should complete with no errors

# Frontend
cd ..
npm install  # Should complete with no errors
```
- [ ] Backend npm install successful
- [ ] Frontend npm install successful
- [ ] No peer dependency warnings about core packages

### 3. Verify Code Changes
Run this to verify all changes are in place:
```bash
# Check Teacher model
grep -c "teaching:" backend/models/Teacher.js
# Should find "teaching:" (school have >=1 occurrence)

# Check server.js has new endpoints
grep -c "teaching" backend/server.js
# Should have multiple occurrences including:
# - POST /api/admin/teachers/:id/teaching
# - DELETE /api/admin/teachers/:id/teaching/:index

# Check cleanup script exists
test -f backend/scripts/cleanupTeacherSubject.js && echo "✓ Script exists" || echo "✗ Script missing"
```
- [ ] Teacher model properly modified
- [ ] New endpoints in server.js
- [ ] Cleanup script exists

## Deployment Steps

### Step 1: Stop Running Services
```bash
# Kill any running npm processes
# If using npm start in terminals, press Ctrl+C

# Or use process killer
pkill -f "npm start"
pkill -f "npm run dev"
```
- [ ] All npm processes stopped
- [ ] No services running on ports 5000, 5173

### Step 2: Verify MongoDB Connection
```bash
mongosh mongodb://127.0.0.1:27017/BANUSchool

# In mongosh shell:
db.teachers.countDocuments()
# Should return a number (even if 0)

exit  # Exit mongosh
```
- [ ] MongoDB connection successful
- [ ] Can see teacher count

### Step 3: Clean Existing Data
Choose ONE option:

#### Option A: Run Node.js Script (Recommended)
```bash
cd backend
node scripts/cleanupTeacherSubject.js

# Output should show:
# ✓ Connected to MongoDB
# ✓ Updated X teacher documents
# ✓ Remaining documents with subject field: 0
# ✅ Cleanup successful!
```
- [ ] Cleanup script ran successfully
- [ ] No errors in output
- [ ] Shows "Cleanup successful"

#### Option B: Use MongoDB Shell
```bash
mongosh mongodb://127.0.0.1:27017/BANUSchool

# In mongosh:
db.teachers.updateMany({}, { $unset: { "subject": "" } });
# Output: { "matched": N, "modified": N }

db.teachers.countDocuments({ subject: { $exists: true } });
# Should return: 0

exit
```
- [ ] Update command successful
- [ ] Count of remaining subject fields: 0

#### Option C: Manual Using Compass
- [ ] Follow steps in `CLEANUP_MONGODB.md` (Option 2)
- [ ] Verified subject field removed from sample document

### Step 4: Start Backend
```bash
cd backend
npm start

# Output should show:
# ✓ MongoDB connected successfully
# ✓ Server running on port 5000
# ✓ API endpoints available
```
- [ ] Backend starts without errors
- [ ] MongoDB connection successful
- [ ] No error messages in console

### Step 5: Start Frontend (Separate Terminal)
```bash
# In new terminal, from project root
npm run dev

# Output should show:
# ✓ Vite server running
# ✓ Local: http://localhost:5173
```
- [ ] Frontend compiles without errors
- [ ] Vite dev server running
- [ ] Can access http://localhost:5173

## Post-Deployment Testing

### Test 1: Create Teacher with Multiple Subjects
```bash
1. Open http://localhost:5173
2. Navigate to Manage Teachers
3. Click "Add Teacher"
4. Fill form:
   - Name: "Test Teacher"
   - Email: "test@example.com"
   - Password: "test123"
5. Click "+ Add class/subject" button
6. First row: Class 9, A, Maths
7. Second row: Class 10, B, Science
8. Click "Add Teacher"
```
- [ ] Form submits successfully
- [ ] No errors in network tab
- [ ] Teacher appears in table

### Test 2: Verify Multiple Assignments Saved
```bash
1. In table, find "Test Teacher"
2. See "2 assignment(s)" in Classes & Subjects column
3. Click to expand - should show both assignments
4. Click "View" - modal should show:
   - Class 9 A badge + Maths
   - Class 10 B badge + Science
```
- [ ] Table shows correct count
- [ ] Expandable list shows all assignments
- [ ] Modal displays all assignments clearly

### Test 3: Add Assignment to Existing Teacher
```bash
1. Edit the "Test Teacher" created above
2. Click "+ Add class/subject"
3. Add third assignment: Class 11, A, Physics
4. Click "Update Teacher"
```
- [ ] Form submits successfully
- [ ] Table now shows "3 assignment(s)"
- [ ] All 3 assignments preserved (Maths, Science, Physics)

### Test 4: Verify Existing Teacher Login Works
```bash
1. If you have an existing teacher account, test login
2. Dashboard should load normally
3. Can view assigned classes
4. Can submit marks for assigned classes
```
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Can perform normal operations

### Test 5: Verify Marks Submission Works
```bash
1. Log in as teacher
2. Navigate to mark submission
3. Try to submit marks for one of the assigned classes
4. Should succeed
```
- [ ] Marks submission endpoint works
- [ ] Teacher permission check uses teaching array correctly

### Test 6: API Endpoint Testing
```bash
# Get a teacher ID from the table (click View)
TEACHER_ID="mongodb_id_here"

# Test POST endpoint (append assignment)
curl -X POST http://localhost:5000/api/admin/teachers/$TEACHER_ID/teaching \
  -H "Content-Type: application/json" \
  -d '{
    "className": "Class 12",
    "section": "C",
    "subject": "Chemistry"
  }'

# Should return teacher object with 4 assignments
```
- [ ] POST endpoint works
- [ ] Returns proper response
- [ ] Assignment count increased

## Rollback Procedure (If Issues Occur)

### If Critical Error
```bash
# 1. Stop services
pkill -f "npm start"
pkill -f "npm run dev"

# 2. Restore database
mongorestore --uri "mongodb://127.0.0.1:27017/BANUSchool" ./mongodump_backup/BANUSchool

# 3. Revert code changes
git checkout backend/models/Teacher.js
git checkout backend/server.js
git checkout src/components/TeachersTable.jsx
git checkout src/pages/ManageTeachers.jsx

# 4. Restart services
cd backend && npm start
# In another terminal:
npm run dev
```
- [ ] Rollback procedure tested (in dev environment)
- [ ] Know how to restore from backup if needed

## Final Verification

### Functional Tests
- [ ] Create teacher with multiple subjects - works
- [ ] Edit teacher and add assignment - works
- [ ] View teacher shows all assignments - works
- [ ] Delete teacher - works  
- [ ] Teacher login - works
- [ ] Marks submission - works
- [ ] Homework creation - works

### Data Integrity
- [ ] No "subject" field in any teacher documents
- [ ] All teaching assignments preserved
- [ ] No duplicate assignments
- [ ] Proper JSON structure in DB

### Performance
- [ ] Page loads quickly (< 2 seconds)
- [ ] No console errors
- [ ] Network requests successful
- [ ] No database connection warnings

### Browser Compatibility
- [ ] Tested in Chrome/Edge (modern browser)
- [ ] Table expands/collapses properly
- [ ] Modal displays correctly
- [ ] Forms are responsive

## Production Handoff Checklist

### Documentation
- [ ] `IMPLEMENTATION_SUMMARY.md` - Team knows what changed
- [ ] `TEACHERS_MULTIPLE_ASSIGNMENTS.md` - How to use system
- [ ] `API_REFERENCE.md` - API changes documented
- [ ] `CLEANUP_MONGODB.md` - Migration steps for others

### Code Quality
- [ ] No console.error logs (except intentional ones)
- [ ] No commented-out code
- [ ] Consistent formatting
- [ ] All changes reviewed by team lead

### Team Communication  
- [ ] Team notified of changes
- [ ] Deployment window scheduled
- [ ] Support team trained on new features
- [ ] Monitoring alerts set up

### Monitoring (First 24 Hours)
- [ ] Check error logs hourly
- [ ] Monitor teacher management page usage
- [ ] Verify mark submissions working
- [ ] Monitor MongoDB disk space
- [ ] Check server CPU/memory usage

## Go-Live Sign-Off

```
Deployment Date: _____________
Deployed By: _____________
Reviewed By: _____________
Approved By: _____________

All tests passed: [ ] YES [ ] NO
Ready for production: [ ] YES [ ] NO
```

## Support Resources

- **Full Documentation:** `TEACHERS_MULTIPLE_ASSIGNMENTS.md`
- **API Documentation:** `API_REFERENCE.md`
- **Database Issues:** `CLEANUP_MONGODB.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **This Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

**Status:** Ready for Deployment ✅
