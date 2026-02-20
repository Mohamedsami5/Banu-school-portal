# MongoDB Data Migration - Remove Legacy `subject` Field from Teachers

This document provides the MongoDB commands to clean up the legacy `subject` field from teacher documents.

## Before You Start

1. **Backup your database** (important!)
   ```bash
   # In your MongoDB installation directory or terminal
   mongodump --uri "mongodb://127.0.0.1:27017/BANUSchool" --out ./backup
   ```

2. Make sure your backend server is **STOPPED** before running these commands.

## Migration Commands

### Option 1: Using MongoDB Shell (mongosh)

Connect to MongoDB:
```bash
mongosh mongodb://127.0.0.1:27017/BANUSchool
```

Then run these commands:

```javascript
// 1. Remove the legacy `subject` field from all teacher documents
db.teachers.updateMany(
  {},
  { $unset: { "subject": "" } }
);

// 2. Verify the cleanup (should show 0 if all removed)
db.teachers.countDocuments({ subject: { $exists: true } });

// 3. Check a sample teacher to ensure teaching array is intact
db.teachers.findOne({}, { password: 0 });
```

### Option 2: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Navigate to `BANUSchool` → `teachers`
3. In the Aggregation tab, add this pipeline:
   ```json
   [
     {
       "$group": {
         "_id": "$_id",
         "teaching": { "$first": "$teaching" },
         "name": { "$first": "$name" },
         "email": { "$first": "$email" }
       }
     },
     {
       "$out": "teachers_temp"
     }
   ]
   ```
4. Then replace the old collection:
   - Delete the original `teachers` collection
   - Rename `teachers_temp` to `teachers`

### Option 3: Using a Node.js Script

Create a file `migrate.js` in your project root:

```javascript
import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/BANUSchool";

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Remove the old subject field from all teachers
    const result = await mongoose.connection.db.collection("teachers").updateMany(
      {},
      { $unset: { "subject": "" } }
    );

    console.log(`Updated ${result.modifiedCount} teacher documents`);

    // Verify cleanup
    const count = await mongoose.connection.db.collection("teachers").countDocuments({
      subject: { $exists: true }
    });

    console.log(`Remaining documents with subject field: ${count}`);

    if (count === 0) {
      console.log("✅ Cleanup successful! All legacy subject fields removed.");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanup();
```

Then run:
```bash
node migrate.js
```

## Verification

After cleanup, verify the data:

```javascript
// Check a sample teacher
db.teachers.findOne({}, { password: 0 });

// Output should look like:
// {
//   _id: ObjectId("..."),
//   name: "John Doe",
//   email: "john@example.com",
//   teaching: [
//     { className: "Class 9", section: "A", subject: "Maths" },
//     { className: "Class 10", section: "B", subject: "Science" }
//   ],
//   status: "Active",
//   role: "teacher",
//   createdAt: ISODate("..."),
//   updatedAt: ISODate("...")
// }
```

## Rollback (if needed)

If you need to rollback, restore from your backup:

```bash
mongorestore --uri "mongodb://127.0.0.1:27017/BANUSchool" ./backup/BANUSchool
```

## Testing

After cleanup:

1. Start your backend server: `npm start`
2. Test assigning multiple subjects to a teacher via the UI
3. Add new teachers with multiple subjects
4. Verify each teacher's teaching array is saved correctly

## Notes

- The cleanup is **safe** - it only removes the unused `subject` field
- The `teaching` array is preserved as-is
- No data is lost beyond removing the legacy field
- Old backups are still usable for reference
