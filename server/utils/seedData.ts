import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { Report } from '../models/Report.ts';
import { Complaint } from '../models/Complaint.ts';
import { Notification } from '../models/Notification.ts';

// High-fidelity civic sample images as clean data URIs / SVG vectors for reliable offline rendering
const SAMPLE_WASTE_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23e2e8f0"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23cbd5e1"/><circle cx="150" cy="180" r="45" fill="%2394a3b8"/><path d="M120 280 L200 210 L280 270 L380 170 L500 280 Z" fill="%2364748b"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Garbage Dump: Plastic &amp; Packaging Pile</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Photo Evidence 1 - Angle: Street Frontage</text></svg>`;

const SAMPLE_WASTE_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f1f5f9"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23e2e8f0"/><polygon points="200,280 300,120 400,280" fill="%23a8b9a1"/><polygon points="350,280 420,180 500,280" fill="%23789074"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Garbage Dump: Sidewalk Obstruction</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Photo Evidence 2 - Angle: Sidewalk Elevation</text></svg>`;

const SAMPLE_WASTE_IMG_3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23e2e8f0"/><circle cx="480" cy="140" r="30" fill="%23fbbf24"/><path d="M80 300 L250 190 L400 290 L520 220 L560 300 Z" fill="%23475569"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Garbage Dump: Storm Drain Spillover</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Photo Evidence 3 - Angle: Proximity &amp; Drainage</text></svg>`;

const SAMPLE_CLEAR_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23dcfce7"/><circle cx="120" cy="140" r="40" fill="%2386efac"/><path d="M160 220 L240 280 L440 140" stroke="%2316a34a" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Collection Verification 1: Swept &amp; Cleared Curb</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Status: 100% Debris Removed</text></svg>`;

const SAMPLE_CLEAR_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23bbf7d0"/><path d="M60 300 L220 240 L380 290 L540 230" stroke="%2322c55e" stroke-width="12" fill="none"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Collection Verification 2: Wide Angle Clearance</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Site Inspection: Cleaned</text></svg>`;

const SAMPLE_CLEAR_IMG_3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23dcfce7"/><rect x="180" y="140" width="240" height="140" rx="10" fill="%23285943"/><text x="240" y="220" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23ffffff">TRUCK LOADED</text><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Collection Verification 3: Tipper Truck Container</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Disposal Batch: Confirmed</text></svg>`;

const SAMPLE_WORKER_VERIFY_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23e2e8f0"/><circle cx="300" cy="180" r="50" fill="%23285943"/><path d="M220 290 C220 230 380 230 380 290 Z" fill="%231e4533"/><rect x="270" y="235" width="60" height="40" rx="4" fill="%23fbbf24"/><text x="282" y="260" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23000">VEST</text><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Worker Verification Photo (On-Site Timestamped)</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Worker ID: EMP-W-402 · Rajesh Kumar</text></svg>`;

export async function seedDatabase(force = false) {
  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    console.log('[Seed] Database already contains records. Skipping auto-seed.');
    return;
  }

  console.log('[Seed] Seeding database with clean demonstration accounts and civic reports...');

  if (force) {
    await User.deleteMany({});
    await Report.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
  }

  // Create standard password hashes
  const salt = await bcrypt.genSalt(10);
  const citizenPass = await bcrypt.hash('CitizenPass@123', salt);
  const workerPass = await bcrypt.hash('WorkerPass@123', salt);
  const adminPass = await bcrypt.hash('AdminPass@123', salt);

  // 1. Create Users
  const citizen1 = await User.create({
    name: 'Arun Patel',
    email: 'arun.patel@gmail.com',
    phone: '+91 98765 43210',
    passwordHash: citizenPass,
    role: 'citizen',
    accountStatus: 'active',
  });

  const citizen2 = await User.create({
    name: 'Priya Nair',
    email: 'priya.nair@gmail.com',
    phone: '+91 98220 11990',
    passwordHash: citizenPass,
    role: 'citizen',
    accountStatus: 'active',
  });

  const worker1 = await User.create({
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@ecocivic.gov.in',
    phone: '+91 91234 56789',
    passwordHash: workerPass,
    role: 'worker',
    accountStatus: 'active',
    workerDetails: {
      employeeId: 'EMP-W-402',
      assignedZone: 'Central Municipal Ward 4',
      isAvailable: true,
      vehicleType: 'Tipper Truck #MH-02-CW-418',
    },
  });

  const worker2 = await User.create({
    name: 'Anita Sharma',
    email: 'anita.sharma@ecocivic.gov.in',
    phone: '+91 97654 32109',
    passwordHash: workerPass,
    role: 'worker',
    accountStatus: 'active',
    workerDetails: {
      employeeId: 'EMP-W-409',
      assignedZone: 'North Sector Ward 7',
      isAvailable: true,
      vehicleType: 'Compactor Van #MH-02-CV-991',
    },
  });

  const admin = await User.create({
    name: 'Municipal Commissioner Desk',
    email: 'admin@ecocivic.gov.in',
    phone: '+91 90000 11223',
    passwordHash: adminPass,
    role: 'admin',
    accountStatus: 'active',
  });

  // Base coordinates: Mumbai Municipal Area [longitude, latitude]
  // Longitude: 72.83, Latitude: 18.94
  const baseLng = 72.8347;
  const baseLat = 18.9388;

  // 2. Create Reports
  // Report 1: Pending (Citizen Arun Patel)
  const report1 = await Report.create({
    reportId: 'RPT-2026-1001',
    title: 'Plastic and Packaging Overflow on Footpath',
    description: 'Severe accumulation of single-use plastic bottles, corrugated cardboard, and beverage containers near the public bus transit shelter. Hindering pedestrians.',
    wasteType: 'Plastic Waste',
    locationAddress: 'Opposite Metro Station Exit 2, Dr. Dadabhai Naoroji Road, Fort, Mumbai 400001',
    locationCoordinates: {
      type: 'Point',
      coordinates: [baseLng + 0.002, baseLat + 0.001], // ~250m away
    },
    locationMethod: 'automatic_gps',
    images: [SAMPLE_WASTE_IMG_1, SAMPLE_WASTE_IMG_2, SAMPLE_WASTE_IMG_3],
    reporterPhone: '+91 98765 43210',
    reportedBy: citizen1._id,
    status: 'Pending',
    priority: 'High',
    auditHistory: [
      {
        action: 'Report Submitted',
        changedBy: citizen1._id,
        changerName: citizen1.name,
        changerRole: 'citizen',
        newStatus: 'Pending',
        explanation: 'Civic report initiated by citizen with 3 verified site photographs.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000),
      },
    ],
  });

  // Report 2: In Progress (Assigned to Rajesh Kumar)
  const report2 = await Report.create({
    reportId: 'RPT-2026-1002',
    title: 'Debris & Commercial Garbage near Market Lane',
    description: 'Mixed vegetable crates, dry leaves, and discarded market packaging accumulated behind the commercial arcade entrance.',
    wasteType: 'Mixed Waste',
    locationAddress: 'Lane 4, Crawford Wholesale Produce Market, Dhobi Talao, Mumbai 400002',
    locationCoordinates: {
      type: 'Point',
      coordinates: [baseLng - 0.003, baseLat + 0.004], // ~500m away
    },
    locationMethod: 'automatic_gps',
    images: [SAMPLE_WASTE_IMG_2, SAMPLE_WASTE_IMG_3, SAMPLE_WASTE_IMG_1],
    reporterPhone: '+91 98765 43210',
    reportedBy: citizen1._id,
    assignedWorker: worker1._id,
    status: 'In Progress',
    priority: 'Medium',
    startedAt: new Date(Date.now() - 45 * 60 * 1000),
    auditHistory: [
      {
        action: 'Report Submitted',
        changedBy: citizen1._id,
        changerName: citizen1.name,
        changerRole: 'citizen',
        newStatus: 'Pending',
        explanation: 'Report created by citizen.',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000),
      },
      {
        action: 'Task Assigned',
        changedBy: admin._id,
        changerName: admin.name,
        changerRole: 'admin',
        previousStatus: 'Pending',
        newStatus: 'Assigned',
        explanation: 'Assigned to field worker Rajesh Kumar based on Ward 4 proximity.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        action: 'Collection Started',
        changedBy: worker1._id,
        changerName: worker1.name,
        changerRole: 'worker',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        explanation: 'Worker arrived at location and commenced manual sweep and truck loading.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
      },
    ],
  });

  // Report 3: Resolved (Completed with full 3+1 evidence photos)
  const report3 = await Report.create({
    reportId: 'RPT-2026-1003',
    title: 'Organic Food Waste Behind Community Kitchen',
    description: 'Overflowing wet waste bin with foul odor outside the community banquet hall.',
    wasteType: 'Organic Waste',
    locationAddress: 'Behind Heritage Hall, K. Dubash Marg, Kala Ghoda, Mumbai 400001',
    locationCoordinates: {
      type: 'Point',
      coordinates: [baseLng + 0.001, baseLat - 0.003],
    },
    locationMethod: 'automatic_gps',
    images: [SAMPLE_WASTE_IMG_3, SAMPLE_WASTE_IMG_1, SAMPLE_WASTE_IMG_2],
    reporterPhone: '+91 98220 11990',
    reportedBy: citizen2._id,
    assignedWorker: worker1._id,
    status: 'Resolved',
    priority: 'Medium',
    startedAt: new Date(Date.now() - 5 * 3600 * 1000),
    resolvedAt: new Date(Date.now() - 3 * 3600 * 1000),
    completionEvidence: {
      collectionImages: [SAMPLE_CLEAR_IMG_1, SAMPLE_CLEAR_IMG_2, SAMPLE_CLEAR_IMG_3],
      workerVerificationImage: SAMPLE_WORKER_VERIFY_IMG,
      completionNotes: 'Area thoroughly cleared and sanitized with disinfectant powder. Waste transferred to composting depot.',
      wasteQuantityEstimate: 'Approx. 350kg in heavy bins',
      submittedAt: new Date(Date.now() - 3 * 3600 * 1000),
      serverRecordedAt: new Date(Date.now() - 3 * 3600 * 1000),
      worker: worker1._id,
    },
    citizenFeedback: {
      rating: 5,
      satisfied: true,
      comment: 'Prompt response! The street is completely spotless now. Great service by the municipal team.',
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    auditHistory: [
      {
        action: 'Report Submitted',
        changedBy: citizen2._id,
        changerName: citizen2.name,
        changerRole: 'citizen',
        newStatus: 'Pending',
        explanation: 'Initial report lodged.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        action: 'Collection Started',
        changedBy: worker1._id,
        changerName: worker1.name,
        changerRole: 'worker',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        explanation: 'Worker initiated collection task.',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000),
      },
      {
        action: 'Task Resolved',
        changedBy: worker1._id,
        changerName: worker1.name,
        changerRole: 'worker',
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        explanation: 'Worker uploaded 3 collection evidence photos + 1 on-site worker verification photo. Site cleared.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000),
      },
    ],
  });

  // Report 4: Electronic Waste / Hazardous warning
  const report4 = await Report.create({
    reportId: 'RPT-2026-1004',
    title: 'Discarded CRT Monitors and Battery Units',
    description: 'Found abandoned electronic components and broken battery casings beside the transformer yard.',
    wasteType: 'Electronic Waste',
    locationAddress: 'Plot 12, P. D’Mello Road, Carnac Bunder, Mumbai 400009',
    locationCoordinates: {
      type: 'Point',
      coordinates: [baseLng + 0.008, baseLat + 0.006],
    },
    locationMethod: 'automatic_gps',
    images: [SAMPLE_WASTE_IMG_1, SAMPLE_WASTE_IMG_2, SAMPLE_WASTE_IMG_3],
    reporterPhone: '+91 98765 43210',
    reportedBy: citizen1._id,
    status: 'Pending',
    priority: 'High',
    auditHistory: [
      {
        action: 'Report Submitted',
        changedBy: citizen1._id,
        changerName: citizen1.name,
        changerRole: 'citizen',
        newStatus: 'Pending',
        explanation: 'Report submitted with electronic waste tag.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000),
      },
    ],
  });

  // 3. Create Sample Complaint on Report 2
  await Complaint.create({
    complaintId: 'CMP-2026-5001',
    report: report2._id,
    reportId: report2.reportId,
    submittedBy: citizen1._id,
    submittedByName: citizen1.name,
    submittedByRole: 'citizen',
    category: 'Garbage not collected within expected timeframe',
    description: 'Garbage collection has been pending since morning. Market vendors are adding more rubbish to the pile.',
    status: 'Under Review',
    resolutionNotes: 'Field worker Rajesh Kumar is already on site and currently clearing the load.',
    reviewedBy: admin._id,
    reviewedByName: admin.name,
  });

  // 4. Create Notifications
  await Notification.create({
    recipient: citizen1._id,
    type: 'assignment',
    title: 'Worker Assigned to Your Report',
    message: `Worker Rajesh Kumar was assigned to collection report ${report2.reportId}.`,
    relatedReport: report2._id,
    relatedReportId: report2.reportId,
  });

  await Notification.create({
    recipient: citizen1._id,
    type: 'report_status',
    title: 'Collection Started',
    message: `Worker Rajesh Kumar has started collecting waste at ${report2.locationAddress}.`,
    relatedReport: report2._id,
    relatedReportId: report2.reportId,
  });

  await Notification.create({
    recipient: worker1._id,
    type: 'assignment',
    title: 'New Priority Task Assigned',
    message: `You have been assigned task ${report2.reportId} at Crawford Wholesale Produce Market.`,
    relatedReport: report2._id,
    relatedReportId: report2.reportId,
  });

  console.log('[Seed] Database successfully seeded with 5 users, 4 reports, 1 complaint, and 3 notifications.');
}
