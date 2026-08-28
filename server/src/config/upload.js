import multer from 'multer';

// memoryStorage, not diskStorage: the file arrives as a Buffer in
// req.file.buffer instead of being written to the local filesystem.
// This is the production-correct choice — hosts like Render/Heroku
// wipe local disk on every redeploy/restart, and multiple server
// instances wouldn't share a local disk anyway. The buffer gets
// uploaded to S3/Cloudinary in the controller, and only the resulting
// URL is stored in MongoDB.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap — an unrestricted
  // upload endpoint (no type/size check) is a classic vulnerability:
  // without this, someone could upload a huge file to exhaust disk/
  // bandwidth, or an executable disguised with a misleading name.
});

export default upload;
