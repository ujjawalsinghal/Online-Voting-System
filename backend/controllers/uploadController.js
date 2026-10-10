
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadCandidateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload.",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "online-voting-system/candidates",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          return res.status(502).json({
            message: "Image upload failed. Please try again.",
          });
        }

        return res.status(200).json({
          message: "Candidate image uploaded successfully.",
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      message: "Server error while uploading image.",
    });
  }
};

module.exports = { uploadCandidateImage };
