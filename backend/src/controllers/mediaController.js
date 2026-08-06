import cloudinary from "../config/cloudinary.js";
import { Media } from "../models/mediaModel.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No image file provided");
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "oil_uploads" },
      async (error, result) => {
        if (error) {
          return next(error);
        }

        const media = await Media.create({
          title: req.body.title || req.file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });

        res.status(201).json({
          success: true,
          data: media,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};

export const getMediaList = async (req, res, next) => {
  try {
    const mediaList = await Media.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: mediaList.length,
      data: mediaList,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      res.status(404);
      throw new Error("Media asset not found");
    }

    await cloudinary.uploader.destroy(media.publicId);
    await media.deleteOne();

    res.status(200).json({
      success: true,
      message: "Media asset deleted from Cloudinary and database",
    });
  } catch (error) {
    next(error);
  }
};
