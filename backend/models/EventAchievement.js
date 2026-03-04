import mongoose from "mongoose";

const eventAchievementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Event", "Achievement"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    imagePath: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EventAchievement", eventAchievementSchema);
