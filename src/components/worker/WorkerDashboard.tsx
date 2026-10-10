import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { WorkerEndTaskModal } from './WorkerEndTaskModal';
import { WorkerComplaintModal } from './WorkerComplaintModal';
import { ReportItem } from '../../types';
import L from 'leaflet';
import {
  Navigation,
  Play,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Radio,
  FileWarning,
  Eye,
  Phone,
  Crosshair,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('nearby');

  // Worker Coordinates (Default to South Mumbai Ward 4)
  const [workerLat, setWorkerLat] = useState<number>(18.9388);
  const [workerLng, setWorkerLng] = useState<number>(72.8347);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [locatingWorker, setLocatingWorker] = useState<boolean>(false);

  // Data states
  const [nearbyReports, setNearbyReports] = useState<ReportItem[]>([]);
  const [myTasks, setMyTasks] = useState<ReportItem[]>([]);
  const [activeTask, setActiveTask] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals
  const [endTaskTarget, setEndTaskTarget] = useState<ReportItem | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<ReportItem | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch nearby reports from MongoDB geospatial index
  const fetchNearby = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = new URLSearchParams({
        lat: String(workerLat),
        lng: String(workerLng),
        radiusKm: String(radiusKm),
      });

      const [resNearby, resTasks] = await Promise.all([
        authFetch(`/api/worker/nearby?${params.toString()}`),
        authFetch('/api/worker/tasks'),
      ]);

      if (resNearby.ok) {
        const data = await resNearby.json();
        if (data.success) {
          setNearbyReports(data.reports || []);
        }
      }

      if (resTasks.ok) {
        const tasksData = await resTasks.json();
        if (tasksData.success) {
          setMyTasks(tasksData.tasks || []);
          setActiveTask(tasksData.activeTask || null);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to fetch nearby municipal tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [workerLat, workerLng, radiusKm]);

  // Request worker device GPS
  const handleDetectWorkerLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser geolocation not supported on this device.');
      return;
    }

    setLocatingWorker(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWorkerLat(pos.coords.latitude);
        setWorkerLng(pos.coords.longitude);
        setLocatingWorker(false);
      },
      (err) => {
        setLocatingWorker(false);
        alert(`Location lookup error: ${err.message}. Using default ward coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Setup Leaflet map for worker view
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (activeTab !== 'nearby') return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [workerLat, workerLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Worker's own location marker
    const workerMarker = L.circleMarker([workerLat, workerLng], {
      radius: 9,
      fillColor: '#285943',
      color: '#FFFFFF',
      weight: 3,
      fillOpacity: 1,
    }).addTo(layer);
    workerMarker.bindPopup(`<b>You are here</b><br/>Ward 4 Vehicle Position`);

    // Radius Circle
    L.circle([workerLat, workerLng], {
      radius: radiusKm * 1000,
      color: '#285943',
      weight: 1.5,
      fillColor: '#A8B9A1',
      fillOpacity: 0.1,
    }).addTo(layer);

    // Add report markers
    nearbyReports.forEach((rep) => {
      const coords = rep.locationCoordinates.coordinates;
      const marker = L.marker([coords[1], coords[0]]).addTo(layer);
      marker.bindPopup(`
        <div style="font-size:12px; font-family:sans-serif;">
          <b>#${rep.reportId}</b> · ${rep.wasteType}<br/>
          <span style="color:#666;">${rep.locationAddress}</span><br/>
          <b>Distance:</b> ${rep.distanceKm ?? '?'} km<br/>
          <b>Status:</b> ${rep.status}
        </div>
      `);
    });

    map.setView([workerLat, workerLng], 13);
  }, [workerLat, workerLng, nearbyReports, radiusKm, activeTab]);

  // Claim Task
  const handleClaimTask = async (reportId: string) => {
    try {
      const res = await authFetch(`/api/worker/tasks/${reportId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchNearby();
      } else {
        alert(data.message || 'Could not claim task.');
      }
    } catch (err) {
      alert('Error claiming task.');
    }
  };

  // Start Collection
  const handleStartCollection = async (reportId: string) => {
    try {
      const res = await authFetch(`/api/worker/tasks/${reportId}/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchNearby();
        setActiveTab('active');
      } else {
        alert(data.message || 'Could not start task.');
      }
    } catch (err) {
      alert('Error starting task.');
    }
  };

  // External Google Maps Navigation Launcher
  const handleLaunchGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F2]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} role="worker" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Worker Field Status Banner */}
        <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#285943] text-white flex items-center justify-center font-bold text-sm">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#252B27]">Field Collection Terminal</h1>
                <span className="text-[11px] font-mono bg-[#2E7D32]/10 text-[#2E7D32] px-2 py-0.5 rounded font-semibold">
                  ACTIVE ON DUTY
                </span>
              </div>
              <p className="text-xs text-[#69716B]">
                Worker: <span className="font-semibold text-[#252B27]">{user?.name}</span> · {user?.workerDetails?.employeeId || 'EMP-W-402'} · {user?.workerDetails?.assignedZone || 'Ward 4'}
              </p>
            </div>
          </div>

          {/* Active Job Callout */}
          {activeTask ? (
            <div className="p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg text-xs flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-[#1E40AF] block">Current Active Task: #{activeTask.reportId}</span>
                <span className="text-[#1E3A8A] truncate max-w-xs block">{activeTask.locationAddress}</span>
              </div>
              <button
                onClick={() => setEndTaskTarget(activeTask)}
                className="px-4 py-2 bg-[#285943] hover:bg-[#1e4533] text-white font-bold rounded-md whitespace-nowrap shadow-xs cursor-pointer"
              >
                End Task →
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#69716B] bg-[#F7F7F2] p-2.5 rounded-lg border border-[#E1E5DF]">
              No collection currently in progress. Select an eligible nearby task below.
            </div>
          )}
        </div>

        {/* Tab 1: Nearby Reports */}
        {activeTab === 'nearby' && (
          <div className="space-y-6">
            {/* Radius and Geolocation Controls */}
            <div className="bg-white p-4 border border-[#E1E5DF] rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#252B27] uppercase tracking-wider">
                  Search Radius:
                </span>
                <div className="flex items-center gap-1 bg-[#F7F7F2] p-1 rounded-md border border-[#E1E5DF] text-xs">
                  {[2, 5, 10, 20].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusKm(r)}
                      className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${
                        radiusKm === r
                          ? 'bg-[#285943] text-white font-bold shadow-xs'
                          : 'text-[#69716B] hover:text-[#252B27]'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#69716B] tabular-nums">
                  Position: {workerLat.toFixed(4)}, {workerLng.toFixed(4)}
                </span>
                <button
                  onClick={handleDetectWorkerLocation}
                  disabled={locatingWorker}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#285943] bg-[#285943]/10 hover:bg-[#285943]/20 rounded-md transition-colors cursor-pointer"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${locatingWorker ? 'animate-spin' : ''}`} />
                  <span>{locatingWorker ? 'Locating...' : 'Refresh GPS'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white p-4 border border-[#E1E5DF] rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#252B27] uppercase tracking-wider">
                  Operational Geospatial Radar ({nearbyReports.length} Tasks in {radiusKm}km)
                </span>
                <span className="text-[#69716B]">Green Dot: Worker · Pins: Eligible Reports</span>
              </div>
              <div
                ref={mapContainerRef}
                style={{ height: '340px' }}
                className="w-full rounded-md border border-[#E1E5DF] overflow-hidden"
              />
            </div>

            {/* Nearby Tasks List */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#252B27] uppercase tracking-wider">
                Eligible Garbage Reports Sorted by Proximity
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white p-6 border border-[#E1E5DF] rounded-xl animate-pulse h-32" />
                  ))}
                </div>
              ) : nearbyReports.length === 0 ? (
                <div className="bg-white p-12 text-center border border-[#E1E5DF] rounded-xl shadow-xs space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#2E7D32] mx-auto" />
                  <h3 className="text-sm font-bold text-[#252B27]">No Actionable Waste Reports in Range</h3>
                  <p className="text-xs text-[#69716B]">
                    No uncollected garbage piles found within {radiusKm} km. Try expanding the search radius.
                  </p>
                </div>
              ) : (
                nearbyReports.map((report) => {
                  const isExpanded = expandedReportId === report._id;
                  const isClaimedByMe =
                    report.assignedWorker &&
                    ((report.assignedWorker as any)._id === user?.id || (report.assignedWorker as any) === user?.id);

                  return (
                    <div
                      key={report._id}
                      className="bg-white border border-[#E1E5DF] hover:border-[#285943]/60 rounded-xl overflow-hidden shadow-xs transition-all"
                    >
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-44 h-36 shrink-0 rounded-lg overflow-hidden bg-neutral-100 relative">
                          <img
                            src={report.images[0]}
                            alt={`Task ${report.reportId}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded">
                            {report.images.length} photos
                          </div>
                          {report.priority === 'Urgent' && (
                            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-[#C53030] text-white font-bold text-[10px] rounded">
                              URGENT
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#285943]">
                                #{report.reportId}
                              </span>
                              <span className="text-xs text-[#69716B]">·</span>
                              <span className="text-xs font-bold text-[#252B27]">
                                {report.wasteType}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-[#285943] bg-[#285943]/10 px-2 py-0.5 rounded">
                                {report.distanceKm ?? '0.4'} km away
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full border font-semibold text-[#252B27] bg-[#F7F7F2]">
                                {report.status}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-[#252B27]">{report.title}</h3>

                          <div className="flex items-start gap-1.5 text-xs text-[#69716B]">
                            <MapPin className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
                            <span>{report.locationAddress}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#69716B] pt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Lodged {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#252B27]">
                              <Phone className="w-3.5 h-3.5 text-[#285943]" />
                              <span>Reporter: {report.reporterPhone}</span>
                            </div>
                          </div>

                          {/* Action Buttons Row (Touch Optimized) */}
                          <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-[#E1E5DF]">
                            {/* 1. Navigate in Google Maps */}
                            <button
                              type="button"
                              onClick={() =>
                                handleLaunchGoogleMaps(
                                  report.locationCoordinates.coordinates[1],
                                  report.locationCoordinates.coordinates[0]
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#252B27] bg-[#F7F7F2] hover:bg-neutral-200 border border-[#E1E5DF] rounded-md transition-colors cursor-pointer"
                            >
                              <Navigation className="w-4 h-4 text-[#285943]" />
                              <span>Navigate in Maps</span>
                            </button>

                            {/* 2. Accept Task / Start Collection */}
                            {report.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => handleClaimTask(report.reportId)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#285943] hover:bg-[#1e4533] rounded-md transition-colors shadow-xs cursor-pointer"
                              >
                                <span>Claim Task</span>
                              </button>
                            )}

                            {(report.status === 'Assigned' || isClaimedByMe) && report.status !== 'In Progress' && (
                              <button
                                type="button"
                                onClick={() => handleStartCollection(report.reportId)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-[#1e3a8a] rounded-md transition-colors shadow-xs cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Start Collection</span>
                              </button>
                            )}

                            {report.status === 'In Progress' && (
                              <button
                                type="button"
                                onClick={() => setEndTaskTarget(report)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#256628] rounded-md transition-colors shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>End Task (Submit Photos)</span>
                              </button>
                            )}

                            {/* 3. Discrepancy / Complaint Button */}
                            <button
                              type="button"
                              onClick={() => setComplaintTarget(report)}
                              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-[#D97706] hover:bg-[#D97706]/10 rounded-md transition-colors ml-auto cursor-pointer"
                              title="Report discrepancy / safety hazard"
                            >
                              <FileWarning className="w-3.5 h-3.5" />
                              <span>Discrepancy</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedReportId(isExpanded ? null : report._id)}
                              className="p-2 text-[#69716B] hover:text-[#252B27] cursor-pointer"
                              title="Toggle details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Gallery of Citizen Photos */}
                      {isExpanded && (
                        <div className="p-4 bg-[#F7F7F2] border-t border-[#E1E5DF] space-y-3">
                          <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider block">
                            All Original Evidence Photos ({report.images.length})
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {report.images.map((img, i) => (
                              <div key={i} className="aspect-4/3 rounded border border-[#E1E5DF] overflow-hidden bg-white">
                                <img
                                  src={img}
                                  alt={`Evidence ${i + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          {report.description && (
                            <p className="text-xs text-[#69716B]">
                              <span className="font-semibold text-[#252B27]">Notes:</span> {report.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Active Task Focus */}
        {activeTab === 'active' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {activeTask ? (
              <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-6">
                <div className="border-b border-[#E1E5DF] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#285943]">#{activeTask.reportId}</span>
                    <h2 className="text-lg font-bold text-[#252B27] mt-0.5">{activeTask.title}</h2>
                    <span className="text-xs text-[#69716B]">{activeTask.wasteType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-[#DBEAFE] text-[#1E40AF] px-2.5 py-1 rounded font-bold">
                      IN PROGRESS
                    </span>
                    <div className="text-[11px] text-[#69716B] font-mono mt-1">
                      Started: {activeTask.startedAt ? new Date(activeTask.startedAt).toLocaleTimeString() : 'Recently'}
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
                    <span className="font-medium text-[#252B27]">{activeTask.locationAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Phone className="w-3.5 h-3.5 text-[#69716B]" />
                    <span className="text-[#69716B]">Citizen Contact: {activeTask.reporterPhone}</span>
                  </div>
                </div>

                {/* Evidence thumbnails */}
                <div>
                  <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider block mb-2">
                    Original Photos for Reference
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {activeTask.images.map((img, i) => (
                      <div key={i} className="aspect-4/3 rounded border border-[#E1E5DF] overflow-hidden">
                        <img src={img} alt={`Ref ${i}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 8: Prominent End Task Button at Bottom */}
                <div className="pt-6 border-t border-[#E1E5DF] space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleLaunchGoogleMaps(activeTask.locationCoordinates.coordinates[1], activeTask.locationCoordinates.coordinates[0])}
                      className="flex-1 py-3 px-4 bg-[#F7F7F2] hover:bg-neutral-200 border border-[#E1E5DF] rounded-lg text-xs font-bold text-[#252B27] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-[#285943]" />
                      <span>Re-Open Google Maps Directions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEndTaskTarget(activeTask)}
                      className="flex-1 py-3 px-4 bg-[#285943] hover:bg-[#1e4533] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#A8B9A1]" />
                      <span>End Task: Submit 3+1 Evidence</span>
                    </button>
                  </div>

                  {/* Section 9: Worker Complaint Option directly below End Task */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setComplaintTarget(activeTask)}
                      className="text-xs text-[#D97706] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileWarning className="w-4 h-4" />
                      <span>Found discrepancy, wrong category, or unsafe conditions on this site? File Grievance</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center border border-[#E1E5DF] rounded-xl shadow-xs space-y-3">
                <Clock className="w-10 h-10 text-[#69716B] mx-auto" />
                <h3 className="text-base font-bold text-[#252B27]">No Task Currently Active</h3>
                <p className="text-xs text-[#69716B] max-w-sm mx-auto">
                  You are not actively collecting waste on any site. Go to Nearby Reports to accept and commence your next task.
                </p>
                <button
                  onClick={() => setActiveTab('nearby')}
                  className="px-4 py-2 bg-[#285943] text-white text-xs font-semibold rounded-md"
                >
                  View Nearby Tasks
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tasks History */}
        {activeTab === 'tasks' && (
          <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#252B27]">Worker Task History</h2>
            <div className="divide-y divide-[#E1E5DF]">
              {myTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#69716B]">No tasks recorded yet.</div>
              ) : (
                myTasks.map((t) => (
                  <div key={t._id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#285943]">#{t.reportId}</span>
                        <span className="text-xs font-semibold text-[#252B27]">{t.wasteType}</span>
                      </div>
                      <div className="text-xs text-[#69716B] mt-0.5">{t.locationAddress}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2.5 py-0.5 rounded-full border font-semibold text-[#252B27] bg-[#F7F7F2]">
                        {t.status}
                      </span>
                      <div className="text-[11px] font-mono text-[#69716B] mt-1">
                        {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Worker Complaints */}
        {activeTab === 'complaints' && (
          <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#252B27]">Field Worker Grievance Submissions</h2>
            <p className="text-xs text-[#69716B]">
              Operational discrepancies filed regarding invalid locations, hazardous materials, or mismatched waste categories.
            </p>
            <div className="text-xs text-[#69716B] bg-[#F7F7F2] p-4 rounded-lg border border-[#E1E5DF]">
              To file a new grievance on a specific job, click "Discrepancy" on any task card under Nearby Reports or Active Collection.
            </div>
          </div>
        )}
      </main>

      {/* End Task Modal */}
      {endTaskTarget && (
        <WorkerEndTaskModal
          task={endTaskTarget}
          onClose={() => setEndTaskTarget(null)}
          onSuccess={() => {
            setEndTaskTarget(null);
            fetchNearby();
            setActiveTab('tasks');
          }}
        />
      )}

      {/* Worker Complaint Modal */}
      {complaintTarget && (
        <WorkerComplaintModal
          task={complaintTarget}
          onClose={() => setComplaintTarget(null)}
          onSuccess={() => {
            setComplaintTarget(null);
            alert('Field discrepancy submitted to municipal oversight queue.');
            fetchNearby();
          }}
        />
      )}

      <Footer />
    </div>
  );
};
