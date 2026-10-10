import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Report } from '../models/Report.ts';
import { Notification } from '../models/Notification.ts';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';

const router = Router();

function getTaskLookup(id: string) {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { reportId: id }] }
    : { reportId: id };
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// All worker routes require authentication and worker or admin role
router.use(authenticate);
router.use(requireRole(['worker', 'admin']));

// GET /api/worker/nearby (Geospatial search of nearby eligible tasks)
router.get('/nearby', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { lat, lng, radiusKm = '5', statusFilter, wasteTypeFilter } = req.query;

    const workerLat = parseFloat(String(lat)) || 18.9388;
    const workerLng = parseFloat(String(lng)) || 72.8347;
    const maxRadiusKm = Math.min(50, Math.max(1, parseFloat(String(radiusKm)) || 5));
    const maxDistanceMeters = maxRadiusKm * 1000;

    const matchQuery: any = {
      // By default show actionable tasks (Pending, Assigned to self, or In Progress by self)
      $or: [
        { status: 'Pending' },
        { assignedWorker: user._id, status: { $in: ['Assigned', 'In Progress'] } },
      ],
    };

    if (statusFilter && statusFilter !== 'All') {
      matchQuery.status = statusFilter;
    }

    if (wasteTypeFilter && wasteTypeFilter !== 'All') {
      matchQuery.wasteType = wasteTypeFilter;
    }

    // MongoDB 2dsphere $near query
    const reports = await Report.find({
      ...matchQuery,
      locationCoordinates: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [workerLng, workerLat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .populate('reportedBy', 'name phone')
      .populate('assignedWorker', 'name phone');

    // Format with computed distance
    const results = reports.map((r) => {
      const rLng = r.locationCoordinates.coordinates[0];
      const rLat = r.locationCoordinates.coordinates[1];
      const distanceKm = calculateDistanceKm(workerLat, workerLng, rLat, rLng);

      return {
        ...r.toObject(),
        distanceKm,
        isAssignedToMe: r.assignedWorker ? (r.assignedWorker as any)._id?.toString() === user._id.toString() : false,
      };
    });

    res.json({
      success: true,
      workerCoordinates: [workerLng, workerLat],
      radiusKm: maxRadiusKm,
      count: results.length,
      reports: results,
    });
  } catch (err: any) {
    console.error('Worker nearby error:', err);
    res.status(500).json({ success: false, message: 'Failed to query nearby reports.' });
  }
});

// GET /api/worker/tasks (Worker's own assigned & completed tasks)
router.get('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status } = req.query;

    const query: any = { assignedWorker: user._id };
    if (status) {
      query.status = status;
    }

    const tasks = await Report.find(query)
      .populate('reportedBy', 'name phone')
      .sort({ updatedAt: -1 });

    const activeTask = tasks.find((t) => t.status === 'In Progress') || null;

    res.json({
      success: true,
      tasks,
      activeTask,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve worker tasks.' });
  }
});

// POST /api/worker/tasks/:id/accept (Worker claims a pending task)
router.post('/tasks/:id/accept', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Concurrency-safe atomic update: only claim if status is 'Pending' or not assigned to someone else
    const report = await Report.findOneAndUpdate(
      {
        ...getTaskLookup(id),
        status: 'Pending',
        assignedWorker: { $exists: false },
      },
      {
        $set: {
          assignedWorker: user._id,
          status: 'Assigned',
        },
        $push: {
          auditHistory: {
            action: 'Task Claimed by Worker',
            changedBy: user._id,
            changerName: user.name,
            changerRole: 'worker',
            previousStatus: 'Pending',
            newStatus: 'Assigned',
            explanation: `Worker ${user.name} (${user.workerDetails?.employeeId || 'ID Verified'}) claimed task for collection.`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('reportedBy', 'name email');

    if (!report) {
      // Check if already claimed
      const existing = await Report.findOne(getTaskLookup(id));
      if (!existing) {
        res.status(404).json({ success: false, message: 'Task not found.' });
        return;
      }
      res.status(409).json({
        success: false,
        message: 'This task is already assigned to another worker or is no longer pending.',
      });
      return;
    }

    // Notify citizen
    await Notification.create({
      recipient: report.reportedBy._id,
      type: 'assignment',
      title: 'Worker Dispatched for Waste Collection',
      message: `Worker ${user.name} has claimed your report #${report.reportId} and is preparing for transit.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
    });

    res.json({
      success: true,
      message: 'Task accepted successfully. You may now navigate to the location and start collection.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to accept task.' });
  }
});

// POST /api/worker/tasks/:id/start (Worker arrives and starts collection)
router.post('/tasks/:id/start', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const report = await Report.findOne(getTaskLookup(id));

    if (!report) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    // Check authorization: must be assigned to this worker or unassigned
    if (report.assignedWorker && report.assignedWorker.toString() !== user._id.toString() && user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You are not authorized to start a task assigned to another worker.' });
      return;
    }

    if (report.status === 'In Progress') {
      res.status(400).json({ success: false, message: 'Task is already in progress.' });
      return;
    }

    if (report.status === 'Resolved') {
      res.status(400).json({ success: false, message: 'Task is already resolved.' });
      return;
    }

    const prevStatus = report.status;
    report.status = 'In Progress';
    report.assignedWorker = user._id;
    report.startedAt = new Date();

    report.auditHistory.push({
      action: 'Collection Started',
      changedBy: user._id,
      changerName: user.name,
      changerRole: 'worker',
      previousStatus: prevStatus,
      newStatus: 'In Progress',
      explanation: `Worker arrived on site. Collection operations initiated at ${new Date().toLocaleTimeString()}.`,
      timestamp: new Date(),
    });

    await report.save();

    // Citizen notification
    await Notification.create({
      recipient: report.reportedBy,
      type: 'report_status',
      title: 'Waste Collection In Progress',
      message: `Worker ${user.name} has arrived at ${report.locationAddress} and commenced garbage clearance.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
    });

    res.json({
      success: true,
      message: 'Collection marked in progress. Please proceed with clearing the waste.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to start collection.' });
  }
});

// POST /api/worker/tasks/:id/complete (End Task: Mandatory 3 collection photos + 1 worker photo)
router.post('/tasks/:id/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const {
      collectionImages,
      workerVerificationImage,
      completionNotes,
      wasteQuantityEstimate,
      consentGiven,
    } = req.body;

    const report = await Report.findOne(getTaskLookup(id));

    if (!report) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    if (report.assignedWorker && report.assignedWorker.toString() !== user._id.toString() && user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized: This task is not assigned to you.' });
      return;
    }

    if (report.status === 'Resolved') {
      res.status(400).json({ success: false, message: 'This task has already been resolved.' });
      return;
    }

    // VALIDATION A: Exactly or at least 3 distinct collection photographs
    if (!collectionImages || !Array.isArray(collectionImages) || collectionImages.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: Exactly or at least three (3) distinct photographs of the cleared site are required (after-work angles, cleared curb, container).',
      });
      return;
    }

    const uniqueEvidence = new Set(collectionImages);
    if (uniqueEvidence.size < 3) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: You cannot reuse the same image to satisfy the required 3 evidence slots. Please capture 3 distinct photographs.',
      });
      return;
    }

    // VALIDATION B: 1 Worker Verification Photograph at the site
    if (!workerVerificationImage || typeof workerVerificationImage !== 'string' || workerVerificationImage.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: One (1) worker verification photograph at the cleared site is required for administrative proof of work.',
      });
      return;
    }

    if (collectionImages.includes(workerVerificationImage)) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: The worker verification photo must be distinct from the collection area photographs.',
      });
      return;
    }

    if (consentGiven === false) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: Worker consent is required for administrative verification photo upload.',
      });
      return;
    }

    // Server-side recorded timestamp
    const serverTimestamp = new Date();

    report.status = 'Resolved';
    report.resolvedAt = serverTimestamp;
    report.completionEvidence = {
      collectionImages,
      workerVerificationImage,
      completionNotes: completionNotes?.trim() || 'Site cleared and inspected by municipal collection team.',
      wasteQuantityEstimate: wasteQuantityEstimate?.trim() || 'Standard municipal collection batch',
      submittedAt: serverTimestamp,
      serverRecordedAt: serverTimestamp,
      worker: user._id,
    };

    report.auditHistory.push({
      action: 'Task Resolved with Verified Evidence',
      changedBy: user._id,
      changerName: user.name,
      changerRole: 'worker',
      previousStatus: 'In Progress',
      newStatus: 'Resolved',
      explanation: `Task marked Resolved. Submitted ${collectionImages.length} site clearance photographs and 1 on-site worker verification record. Quantity estimate: ${report.completionEvidence.wasteQuantityEstimate}.`,
      timestamp: serverTimestamp,
    });

    await report.save();

    // Citizen notification with resolution celebration
    await Notification.create({
      recipient: report.reportedBy,
      type: 'completion',
      title: 'Garbage Collection Completed & Resolved',
      message: `Your report #${report.reportId} has been successfully cleared and resolved by Worker ${user.name}. View completion evidence in My Reports.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
    });

    res.json({
      success: true,
      message: 'Task completed successfully! Completion photographs and verification record logged.',
      report,
    });
  } catch (err: any) {
    console.error('Task complete error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to complete task.' });
  }
});

export default router;
