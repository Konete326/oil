import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String },
    bytes: { type: Number },
  },
  { timestamps: true }
);

export const Media = mongoose.model("Media", mediaSchema);
