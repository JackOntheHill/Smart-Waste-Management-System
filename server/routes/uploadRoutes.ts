import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { upload, UPLOADS_PATH } from '../middleware/upload.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

// POST /api/upload/multiple
router.post('/multiple', authenticate, upload.array('images', 8), (req: Request, res: Response): void => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No images were provided in the upload request.' });
      return;
    }

    const urls = files.map((file) => `/uploads/${file.filename}`);
    res.json({
      success: true,
      message: `${files.length} images uploaded successfully.`,
      urls,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
  }
});

// POST /api/upload/base64 (Direct fallback for canvas / camera data-urls)
router.post('/base64', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ success: false, message: 'Valid image base64 data required.' });
      return;
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ success: false, message: 'Invalid data URL format.' });
      return;
    }

    const ext = matches[1].includes('png') ? '.png' : matches[1].includes('webp') ? '.webp' : '.jpg';
    const uniqueName = `waste-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(UPLOADS_PATH, uniqueName);

    const buffer = Buffer.from(matches[2], 'base64');
    await fs.promises.writeFile(targetPath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueName}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to process base64 image.' });
  }
});

export default router;
