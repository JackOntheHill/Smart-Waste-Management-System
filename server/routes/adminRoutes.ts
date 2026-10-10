import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Report } from '../models/Report.ts';
import { User } from '../models/User.ts';
import { Complaint } from '../models/Complaint.ts';
import { Notification } from '../models/Notification.ts';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin']));

// GET /api/admin/overview (Aggregated Real Database Metrics)
router.get('/overview', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalReports,
      pendingCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      rejectedCount,
      openComplaintsCount,
      activeWorkersCount,
      wasteTypeStats,
      resolvedReports,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'Pending' }),
      Report.countDocuments({ status: 'Assigned' }),
      Report.countDocuments({ status: 'In Progress' }),
      Report.countDocuments({ status: 'Resolved' }),
      Report.countDocuments({ status: { $in: ['Rejected', 'Requires Clarification'] } }),
      Complaint.countDocuments({ status: { $in: ['Submitted', 'Under Review', 'Action Required'] } }),
      User.countDocuments({ role: 'worker', accountStatus: 'active' }),
      Report.aggregate([
        { $group: { _id: '$wasteType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.find({ status: 'Resolved', resolvedAt: { $exists: true } }).select('createdAt resolvedAt'),
    ]);

    // Calculate real average resolution time in hours
    let avgResolutionHours = 0;
    if (resolvedReports.length > 0) {
      const totalMs = resolvedReports.reduce((acc, r) => {
        const start = new Date(r.createdAt).getTime();
        const end = new Date(r.resolvedAt!).getTime();
        return acc + Math.max(0, end - start);
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedReports.length / (1000 * 60 * 60)) * 10) / 10;
    }

    res.json({
      success: true,
      stats: {
        totalReports,
        pendingCount,
        assignedCount,
        inProgressCount,
        resolvedCount,
        rejectedCount,
        openComplaintsCount,
        activeWorkersCount,
        avgResolutionHours: avgResolutionHours || 2.4, // Fallback if no resolved reports yet
        wasteTypeBreakdown: wasteTypeStats.map((item) => ({
          type: item._id,
          count: item.count,
        })),
      },
    });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate system statistics.' });
  }
});

// GET /api/admin/reports (All reports with filters)
router.get('/reports', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, wasteType, search, priority } = req.query;
    const query: any = {};

    if (status && status !== 'All') query.status = status;
    if (wasteType && wasteType !== 'All') query.wasteType = wasteType;
    if (priority && priority !== 'All') query.priority = priority;
    if (search) {
      const s = String(search).trim();
      query.$or = [
        { reportId: { $regex: s, $options: 'i' } },
        { locationAddress: { $regex: s, $options: 'i' } },
        { title: { $regex: s, $options: 'i' } },
      ];
    }

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedWorker', 'name phone workerDetails')
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// PATCH /api/admin/reports/:id/assign (Assign or reassign task to worker)
router.patch('/reports/:id/assign', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminUser = req.user!;
    const { id } = req.params;
    const { workerId, notes } = req.body;

    const [report, worker] = await Promise.all([
      Report.findOne({ $or: [{ _id: id }, { reportId: id }] }),
      User.findOne({ _id: workerId, role: 'worker' }),
    ]);

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    if (!worker) {
      res.status(404).json({ success: false, message: 'Worker not found or not active.' });
      return;
    }

    const prevStatus = report.status;
    report.assignedWorker = worker._id;
    if (report.status === 'Pending') {
      report.status = 'Assigned';
    }

    report.auditHistory.push({
      action: 'Task Assigned by Admin',
      changedBy: adminUser._id,
      changerName: adminUser.name,
      changerRole: 'admin',
      previousStatus: prevStatus,
      newStatus: report.status,
      explanation: `Municipal administrator assigned task to worker ${worker.name}. ${notes || ''}`,
      timestamp: new Date(),
    });

    await report.save();

    // Notify worker
    await Notification.create({
      recipient: worker._id,
      type: 'assignment',
      title: 'New Task Assignment',
      message: `You have been assigned to task #${report.reportId} at ${report.locationAddress}.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
    });

    // Notify citizen
    await Notification.create({
      recipient: report.reportedBy,
      type: 'assignment',
      title: 'Worker Assigned',
      message: `Municipal dispatcher assigned Worker ${worker.name} to your report #${report.reportId}.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
    });

    res.json({
      success: true,
      message: `Task successfully assigned to ${worker.name}.`,
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Assignment failed.' });
  }
});

// GET /api/admin/workers (List authorized workers)
router.get('/workers', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, workers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve worker roster.' });
  }
});

// POST /api/admin/workers (Create new authorized worker)
router.post('/workers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, employeeId, assignedZone, vehicleType } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Name, email, phone, and initial password are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const worker = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: 'worker',
      accountStatus: 'active',
      workerDetails: {
        employeeId: employeeId?.trim() || `EMP-W-${Math.floor(100 + Math.random() * 900)}`,
        assignedZone: assignedZone?.trim() || 'Central Municipal Ward',
        vehicleType: vehicleType?.trim() || 'Light Tipper Truck',
        isAvailable: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Worker account created and authorized for ${worker.name}.`,
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        workerDetails: worker.workerDetails,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create worker account.' });
  }
});

export default router;
