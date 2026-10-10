import { Router, Response } from 'express';
import { Notification } from '../models/Notification.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      readAt: { $exists: false },
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    await Notification.findOneAndUpdate(
      { _id: id, recipient: user._id },
      { $set: { readAt: new Date() } }
    );

    res.json({ success: true, message: 'Marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    await Notification.updateMany(
      { recipient: user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
});

export default router;
