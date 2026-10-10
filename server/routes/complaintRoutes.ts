import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Complaint, ComplaintCategory } from '../models/Complaint.ts';
import { Report } from '../models/Report.ts';
import { Notification } from '../models/Notification.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// POST /api/complaints (Create complaint linked to a report)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { reportId, category, description, supportingImages } = req.body;

    if (!reportId) {
      res.status(400).json({ success: false, message: 'A linked Report ID is required.' });
      return;
    }

    if (!category) {
      res.status(400).json({ success: false, message: 'Please select a complaint category.' });
      return;
    }

    if (!description || description.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Please provide a clear description of at least 10 characters.' });
      return;
    }

    const reportQuery = mongoose.Types.ObjectId.isValid(reportId)
      ? { $or: [{ _id: reportId }, { reportId }] }
      : { reportId };
    const report = await Report.findOne(reportQuery);

    if (!report) {
      res.status(404).json({ success: false, message: 'Referenced report not found.' });
      return;
    }

    // Prevent duplicate unresolved complaints of same category by same user
    const existingActiveComplaint = await Complaint.findOne({
      report: report._id,
      submittedBy: user._id,
      category,
      status: { $in: ['Submitted', 'Under Review', 'Action Required'] },
    });

    if (existingActiveComplaint) {
      res.status(409).json({
        success: false,
        message: `An active complaint for "${category}" is already registered under ID #${existingActiveComplaint.complaintId}.`,
        complaint: existingActiveComplaint,
      });
      return;
    }

    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const complaintId = `CMP-${year}-${(5001 + count).toString()}`;

    const complaint = await Complaint.create({
      complaintId,
      report: report._id,
      reportId: report.reportId,
      submittedBy: user._id,
      submittedByName: user.name,
      submittedByRole: user.role === 'worker' ? 'worker' : 'citizen',
      category: category as ComplaintCategory,
      description: description.trim(),
      supportingImages: Array.isArray(supportingImages) ? supportingImages : [],
      status: 'Submitted',
    });

    // Update audit trail on the report without overwriting original content
    report.auditHistory.push({
      action: `Complaint Lodged (${user.role.toUpperCase()})`,
      changedBy: user._id,
      changerName: user.name,
      changerRole: user.role,
      explanation: `Complaint #${complaintId} filed under category: "${category}". Flagged for administrative review.`,
      timestamp: new Date(),
    });
    await report.save();

    // Confirmation notification to complainant
    await Notification.create({
      recipient: user._id,
      type: 'complaint_update',
      title: 'Complaint Registered',
      message: `Your grievance #${complaintId} regarding report #${report.reportId} has been submitted for municipal review.`,
      relatedReport: report._id,
      relatedReportId: report.reportId,
      relatedComplaint: complaint._id,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint successfully registered and queued for municipal oversight.',
      complaint,
    });
  } catch (err: any) {
    console.error('Complaint creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit complaint.' });
  }
});

// GET /api/complaints (List complaints)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { reportId, status } = req.query;

    const query: any = {};

    // Citizens and workers see their submitted complaints unless admin
    if (user.role !== 'admin') {
      query.submittedBy = user._id;
    }

    if (reportId) {
      if (mongoose.Types.ObjectId.isValid(String(reportId))) {
        query.$or = [{ report: reportId }, { reportId }];
      } else {
        query.reportId = reportId;
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('report', 'reportId title status wasteType locationAddress images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
});

// GET /api/complaints/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lookup = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { complaintId: id }] }
      : { complaintId: id };
    const complaint = await Complaint.findOne(lookup).populate('report');

    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found.' });
      return;
    }

    res.json({ success: true, complaint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve complaint.' });
  }
});

// PATCH /api/complaints/:id (Admin review)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Administrative access required to update complaint status.' });
      return;
    }

    const lookup = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { complaintId: id }] }
      : { complaintId: id };
    const complaint = await Complaint.findOne(lookup);

    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found.' });
      return;
    }

    if (status) complaint.status = status;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
    complaint.reviewedBy = user._id;
    complaint.reviewedByName = user.name;

    await complaint.save();

    // Notify the user who lodged the complaint
    await Notification.create({
      recipient: complaint.submittedBy,
      type: 'complaint_update',
      title: `Complaint #${complaint.complaintId} Updated`,
      message: `Status updated to "${complaint.status}". Review note: ${resolutionNotes || 'Processed by administration.'}`,
      relatedComplaint: complaint._id,
      relatedReportId: complaint.reportId,
    });

    res.json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update complaint.' });
  }
});

export default router;
