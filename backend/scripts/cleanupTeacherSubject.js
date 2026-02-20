import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/BANUSchool";

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Remove the old subject field from all teachers
    const result = await mongoose.connection.db.collection("teachers").updateMany(
      {},
      { $unset: { "subject": "" } }
    );

    console.log(`✓ Updated ${result.modifiedCount} teacher documents`);

    // Verify cleanup
    const count = await mongoose.connection.db.collection("teachers").countDocuments({
      subject: { $exists: true }
    });

    console.log(`✓ Remaining documents with subject field: ${count}`);

    // Show sample teacher
    const sample = await mongoose.connection.db.collection("teachers").findOne({});
    if (sample) {
      console.log("\n✓ Sample teacher document (cleaned):");
      console.log(JSON.stringify(sample, null, 2));
    }

    if (count === 0) {
      console.log("\n✅ Cleanup successful! All legacy subject fields removed.");
    } else {
      console.warn(`\n⚠️  Warning: ${count} documents still have subject field`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
    process.exit(1);
  }
}

cleanup();
