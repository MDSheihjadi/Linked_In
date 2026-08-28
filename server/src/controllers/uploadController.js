import cloudinary from '../config/cloudinary.js';

/**
 * Streams the in-memory file buffer (from Multer's memoryStorage) up
 * to Cloudinary. We wrap Cloudinary's callback-based upload_stream in
 * a Promise so it can be awaited cleanly like any other async call.
 */
function streamUpload(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'linkedin-clone', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// POST /api/upload  (multipart/form-data, field name "image")
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      // Fail with a clear, actionable error rather than a confusing
      // Cloudinary SDK stack trace if env vars were never set up.
      return res.status(500).json({
        message:
          'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    const result = await streamUpload(req.file.buffer);

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id, // needed later if you want to delete/replace the image
    });
  } catch (err) {
    next(err);
  }
};
