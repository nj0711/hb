import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pg_booking',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

// Multer upload middleware
export const upload = multer({ storage });

// ✅ Function to upload a file to Cloudinary and return { url, public_id }
export const uploadToCloudinary = async (file) => {
  try {
    // Case: file is already a Cloudinary URL (when keeping existing images)
    if (typeof file === 'string' && file.startsWith('http')) {
      return { url: file, public_id: null }; // keep consistency
    }

    // Case: file uploaded via multer-storage-cloudinary → already has path & filename
    if (file && file.path && file.filename) {
      return { url: file.path, public_id: file.filename };
    }

    // Case: fallback manual upload (e.g. using buffer)
    if (file && file.buffer) {
      const result = await cloudinary.uploader.upload(file.buffer, {
        folder: 'pg_booking',
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      });
      return { url: result.secure_url, public_id: result.public_id };
    }

    throw new Error('Invalid file format');
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// ✅ Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Error deleting image from Cloudinary');
  }
};
