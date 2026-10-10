import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Report, ReportStatus, WasteType } from '../models/Report.ts';
import { Notification } from '../models/Notification.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Helper to calculate distance in meters between two coordinates (Haversine formula)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// POST /api/reports/check-duplicate
router.post('/check-duplicate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { longitude, latitude, wasteType } = req.body;

    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      res.status(400).json({ success: false, message: 'Valid numerical longitude and latitude are required.' });
      return;
    }

    // Look for pending or in-progress reports within 300 meters
    const nearbyReports = await Report.find({
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
      locationCoordinates: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 300, // 300 meters
        },
      },
    }).limit(3);

    res.json({
      success: true,
      hasPotentialDuplicate: nearbyReports.length > 0,
      nearbyReports: nearbyReports.map((r) => ({
        reportId: r.reportId,
        title: r.title,
        wasteType: r.wasteType,
        status: r.status,
        address: r.locationAddress,
        distanceMeters: Math.round(
          calculateDistanceMeters(latitude, longitude, r.locationCoordinates.coordinates[1], r.locationCoordinates.coordinates[0])
        ),
      })),
    });
  } catch (err: any) {
    console.error('Duplicate check error:', err);
    res.json({ success: true, hasPotentialDuplicate: false, nearbyReports: [] });
  }
});

// POST /api/reports (Submit new garbage report)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      wasteType,
      customWasteType,
      locationAddress,
      latitude,
      longitude,
      locationMethod,
      images,
      reporterPhone,
    } = req.body;

    // 1. Image count validation (MANDATORY at least 3 distinct images)
    if (!images || !Array.isArray(images) || images.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: A minimum of three (3) distinct photographs of the garbage accumulation is strictly required.',
      });
      return;
    }

    // Verify distinctness
    const uniqueImages = new Set(images);
    if (uniqueImages.size < 3) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: Please upload at least three distinct images from different angles or distances, not duplicate photos.',
      });
      return;
    }

    // 2. Validate garbage type
    const validWasteTypes: WasteType[] = [
      'Household / General Waste',
      'Plastic Waste',
      'Organic Waste',
      'Electronic Waste',
      'Construction Debris',
      'Medical or Hazardous Waste',
      'Mixed Waste',
      'Other',
    ];

    if (!validWasteTypes.includes(wasteType)) {
      res.status(400).json({ success: false, message: 'Invalid garbage type selected.' });
      return;
    }

    if (wasteType === 'Other' && (!customWasteType || customWasteType.trim().length === 0)) {
      res.status(400).json({ success: false, message: 'Please provide a specification for "Other" waste type.' });
      return;
    }

    // 3. Location validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ success: false, message: 'Invalid or missing geographical coordinates.' });
      return;
    }

    if (!locationAddress || locationAddress.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please provide a valid street address or landmark.' });
      return;
    }

    // 4. Phone validation
    const contactPhone = reporterPhone || user.phone;
    if (!contactPhone || contactPhone.trim().length < 8) {
      res.status(400).json({ success: false, message: 'A valid reporter contact phone number is required.' });
      return;
    }

    // 5. Generate unique Report ID
    const year = new Date().getFullYear();
    const count = await Report.countDocuments();
    const reportId = `RPT-${year}-${(1001 + count).toString()}`;

    // Priority calculation
    let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
    if (wasteType === 'Medical or Hazardous Waste') {
      priority = 'Urgent';
    } else if (wasteType === 'Electronic Waste' || wasteType === 'Plastic Waste') {
      priority = 'High';
    }

    const newReport = await Report.create({
      reportId,
      title: title?.trim() || `${wasteType} Accumulation at ${locationAddress.split(',')[0]}`,
      description: description?.trim() || '',
      wasteType,
      customWasteType: customWasteType?.trim(),
      locationAddress: locationAddress.trim(),
      locationCoordinates: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      locationMethod: locationMethod || 'automatic_gps',
      images,
      reporterPhone: contactPhone.trim(),
      reportedBy: user._id,
      status: 'Pending',
      priority,
      auditHistory: [
        {
          action: 'Report Submitted',
          changedBy: user._id,
          changerName: user.name,
          changerRole: user.role,
          newStatus: 'Pending',
          explanation: `Report officially lodged by citizen with ${images.length} verified site photographs. Initial priority set to ${priority}.`,
          timestamp: new Date(),
        },
      ],
    });

    // In-app Notification for Citizen
    await Notification.create({
      recipient: user._id,
      type: 'report_status',
      title: 'Report Submitted Successfully',
      message: `Your report #${reportId} has been registered and scheduled for municipal inspection.`,
      relatedReport: newReport._id,
      relatedReportId: reportId,
    });

    res.status(201).json({
      success: true,
      message: 'Garbage report submitted and saved to municipal database successfully.',
      report: newReport,
    });
  } catch (err: any) {
    console.error('Report submission error:', err);
    res.status(500).json({ success: false, message: err.message || 'Error submitting report.' });
  }
});

// GET /api/reports (List citizen reports or all reports)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, wasteType, search, page = '1', limit = '10' } = req.query;

    const query: any = {};

    // Citizens only see their own reports unless admin
    if (user.role === 'citizen') {
      query.reportedBy = user._id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (wasteType && wasteType !== 'All') {
      query.wasteType = wasteType;
    }

    if (search) {
      const searchStr = String(search).trim();
      query.$or = [
        { reportId: { $regex: searchStr, $options: 'i' } },
        { locationAddress: { $regex: searchStr, $options: 'i' } },
        { title: { $regex: searchStr, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reportedBy', 'name email phone')
        .populate('assignedWorker', 'name phone workerDetails')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    res.json({
      success: true,
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving reports.' });
  }
});

// GET /api/reports/:id (Single report detail)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const query = id.startsWith('RPT-') ? { reportId: id } : { _id: id };
    const report = await Report.findOne(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedWorker', 'name phone workerDetails')
      .populate('completionEvidence.worker', 'name phone workerDetails');

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // Role check: If citizen, ensure ownership
    if (user.role === 'citizen' && report.reportedBy && (report.reportedBy as any)._id.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied: You are not the author of this report.' });
      return;
    }

    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error retrieving report detail.' });
  }
});

// PATCH /api/reports/:id (Edit pending report)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, wasteType, locationAddress } = req.body;

    const lookup = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { reportId: id }] }
      : { reportId: id };
    const report = await Report.findOne(lookup);

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // Ownership check
    if (user.role === 'citizen' && report.reportedBy.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to edit this report.' });
      return;
    }

    // Critical constraint: Can only edit if Pending or Requires Clarification
    if (report.status !== 'Pending' && report.status !== 'Requires Clarification') {
      res.status(400).json({
        success: false,
        message: `Report cannot be directly edited because its status is already "${report.status}". For in-progress or resolved reports, please submit a formal correction complaint instead.`,
      });
      return;
    }

    if (title) report.title = title.trim();
    if (description !== undefined) report.description = description.trim();
    if (wasteType) report.wasteType = wasteType;
    if (locationAddress) report.locationAddress = locationAddress.trim();

    report.auditHistory.push({
      action: 'Report Details Updated',
      changedBy: user._id,
      changerName: user.name,
      changerRole: user.role,
      explanation: 'Citizen amended report details prior to collection dispatch.',
      timestamp: new Date(),
    });

    await report.save();

    res.json({
      success: true,
      message: 'Report details successfully updated.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
});

// POST /api/reports/:id/feedback (Citizen satisfaction & verification)
router.post('/:id/feedback', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { rating, satisfied, comment } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Please provide a valid star rating between 1 and 5.' });
      return;
    }

    const feedbackLookup = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { reportId: id }] }
      : { reportId: id };
    const report = await Report.findOne(feedbackLookup);

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    if (report.reportedBy.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Only the citizen who reported this issue can submit feedback.' });
      return;
    }

    if (report.status !== 'Resolved') {
      res.status(400).json({ success: false, message: 'Feedback can only be provided for resolved collection reports.' });
      return;
    }

    report.citizenFeedback = {
      rating,
      satisfied: Boolean(satisfied),
      comment: comment?.trim() || '',
      submittedAt: new Date(),
    };

    report.auditHistory.push({
      action: 'Citizen Feedback Logged',
      changedBy: user._id,
      changerName: user.name,
      changerRole: 'citizen',
      explanation: `Citizen rated collection quality ${rating}/5 stars. Clearance verified: ${satisfied ? 'Yes' : 'No'}.`,
      timestamp: new Date(),
    });

    await report.save();

    res.json({
      success: true,
      message: 'Thank you! Your civic feedback has been saved and shared with the municipal sanitation department.',
      feedback: report.citizenFeedback,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

export default router;
