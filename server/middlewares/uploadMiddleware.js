import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 1. Detect if the file is Audio
    const isAudio = file.mimetype.startsWith('audio');
    
    // 2. Get the file extension (e.g., "mp3", "m4a")
    const ext = file.originalname.split('.').pop();

    return {
      folder: 'resilio_uploads',
      
      // ✅ CRITICAL FIX: Cloudinary needs 'video' for audio files
      resource_type: isAudio ? 'video' : 'image',
      
      // ✅ Keep the original format (mp3/m4a)
      format: ext, 
      
      public_id: file.fieldname + '-' + Date.now(),
    };
  },
});

const upload = multer({ storage });

export default upload;