import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Hospital, RouteOption, EmergencyLevel } from '../../types';
import { 
  PlusCircle, 
  MapPin, 
  Crosshair, 
  Building2, 
  Bed, 
  Navigation, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

interface NewEmergencyRequestProps {
  onSuccess: (requestId: string) => void;
  onCancel: () => void;
}

export const NewEmergencyRequest: React.FC<NewEmergencyRequestProps> = ({ onSuccess, onCancel }) => {
  const { addToast } = useNotifications();

  // Patient Info
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('CRITICAL');

  // Location Acquisition State
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [acquiringGps, setAcquiringGps] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('GPS Coordinates not yet acquired');

  // Hospital Selection
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  // Route Options
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteName, setSelectedRouteName] = useState('Fastest Primary Corridor');
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch verified hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.getHospitals();
        setHospitals(res.hospitals);
        if (res.hospitals.length > 0) {
          setSelectedHospitalId(res.hospitals[0].hospital_id);
        }
      } catch (err: any) {
        setErrorMsg('Failed to load verified hospitals: ' + err.message);
      } finally {
        setLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  // Browser Geolocation Acquisition
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusText('Browser Geolocation is not supported on this device/browser.');
      setIsManualLocation(true);
      return;
    }

    setAcquiringGps(true);
    setGpsStatusText('Accessing device GPS satellite constellation...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setCurrentLat(lat);
        setCurrentLng(lng);
        setGpsAccuracy(acc);
        setIsManualLocation(false);
        setGpsStatusText(`GPS satellite fix acquired: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (±${Math.round(acc)}m)`);
        setAcquiringGps(false);
        setLocationAddress(`Device GPS Position (Accuracy ±${Math.round(acc)}m)`);

        addToast({
          type: 'success',
          title: 'Satellite GPS Acquired',
          message: `Accuracy: ±${Math.round(acc)}m`,
        });
      },
      (error) => {
        setAcquiringGps(false);
        setIsManualLocation(true);
        let msg = 'GPS acquisition failed.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'GPS permission denied by user. Switched to manual coordinates.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'GPS position unavailable. Switched to manual coordinates.';
            break;
          case error.TIMEOUT:
            msg = 'GPS request timed out. Switched to manual coordinates.';
            break;
        }
        setGpsStatusText(msg);
        addToast({
          type: 'warning',
          title: 'GPS Offline',
          message: msg,
        });

        // Set default emergency center coords as manual starting point if empty
        if (!currentLat || !currentLng) {
          setCurrentLat(12.9780);
          setCurrentLng(77.5850);
          setLocationAddress('Central Emergency Rendezvous');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Recalculate routes when coords or selected hospital changes
  useEffect(() => {
    if (!currentLat || !currentLng || !selectedHospitalId) return;

    const targetHosp = hospitals.find((h) => h.hospital_id === selectedHospitalId);
    if (!targetHosp) return;

    const computeRoutes = async () => {
      setCalculatingRoutes(true);
      try {
        const res = await api.calculateRoutes(currentLat, currentLng, targetHosp.latitude, targetHosp.longitude);
        setRoutes(res.routes);
        if (res.routes.length > 0) {
          setSelectedRouteName(res.routes[0].name);
        }
      } catch (err) {
        console.warn('Routing calculation error:', err);
      } finally {
        setCalculatingRoutes(false);
      }
    };

    computeRoutes();
  }, [currentLat, currentLng, selectedHospitalId, hospitals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientName || patientAge === '' || !selectedHospitalId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (currentLat === null || currentLng === null) {
      setErrorMsg('Location coordinates are required. Please acquire GPS or enter manual coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createEmergencyRequest({
        patient_name: patientName.trim(),
        patient_age: Number(patientAge),
        emergency_level: emergencyLevel,
        current_lat: currentLat,
        current_lng: currentLng,
        location_address: locationAddress.trim() || 'Current Ambulance Coordinates',
        is_manual_location: isManualLocation,
        hospital_id: selectedHospitalId,
        selected_route: selectedRouteName,
      });

      addToast({
        type: 'success',
        title: 'Emergency Request Dispatched',
        message: `Assigned ID ${res.request.request_id}. Target hospital has been alerted.`,
        duration: 7000,
      });

      onSuccess(res.request.request_id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit emergency request.');
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Error transmitting request to hospital.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Patient Intake Dispatch</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Initiate Emergency Transfer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize real coordinates, verify hospital beds, and transmit instant triage alert.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PATIENT CLINICAL DATA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-xs flex items-center justify-center mr-2 font-bold">1</span>
            Patient Clinical Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                Patient Age *
              </label>
              <input
                type="number"
                min="0"
                max="130"
                required
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 58"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-2">
              Emergency Severity Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as EmergencyLevel[]).map((lvl) => {
                const isSelected = emergencyLevel === lvl;
                return (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setEmergencyLevel(lvl)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? lvl === 'CRITICAL'
                          ? 'bg-emergency-600 text-white border-emergency-600 ring-2 ring-emergency-600/30 shadow-md'
                          : lvl === 'HIGH'
                          ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                          : lvl === 'MEDIUM'
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                          : 'bg-slate-700 text-white border-slate-700 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="uppercase">{lvl}</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">
                      {lvl === 'CRITICAL' ? 'Immediate Trauma/Cardiac' : lvl === 'HIGH' ? 'Urgent Stabilization' : lvl === 'MEDIUM' ? 'Standard Transfer' : 'Non-Urgent'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: DEVICE GPS ACQUISITION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-xs flex items-center justify-center mr-2 font-bold">2</span>
              Ambulance Incident Coordinates
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isManualLocation ? 'bg-amber-100 text-amber-800' : currentLat ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
              {isManualLocation ? 'Manual Coordinates' : currentLat ? 'Verified Device GPS' : 'Awaiting GPS Fix'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-navy-950 flex items-center">
                <Crosshair className={`w-4 h-4 mr-1.5 ${acquiringGps ? 'text-amber-500 animate-spin' : currentLat ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{gpsStatusText}</span>
              </div>
              {currentLat !== null && currentLng !== null && (
                <p className="font-mono text-slate-500 text-[11px]">
                  Current Lat: {currentLat.toFixed(5)}, Long: {currentLng.toFixed(5)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={acquiringGps}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{acquiringGps ? 'Acquiring...' : 'Acquire GPS Position'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualLocation(!isManualLocation)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                {isManualLocation ? 'Hide Manual' : 'Manual Entry'}
              </button>
            </div>
          </div>

          {/* Manual Input Fields if GPS is unavailable or explicitly chosen */}
          {isManualLocation && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
              <p className="text-[11px] text-amber-800 font-medium">
                Note: Manual entry is active. In accordance with system policy, manual positions are recorded distinctly from satellite GPS readings.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-navy-950 uppercase mb-1">Latitude (-90 to 90)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={currentLat ?? ''}
                    onChange={(e) => setCurrentLat(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="12.9780"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-950 uppercase mb-1">Longitude (-180 to 180)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={currentLng ?? ''}
                    onChange={(e) => setCurrentLng(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="77.5850"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-950 uppercase mb-1">Incident Address / Landline</label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="e.g. 5th Avenue & Market St"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: DESTINATION HOSPITAL SELECTION WITH LIVE BEDS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-xs flex items-center justify-center mr-2 font-bold">3</span>
              Select Verified Destination Hospital
            </h3>
            <span className="text-xs text-slate-500">
              Only verified hospitals with live beds shown
            </span>
          </div>

          {loadingHospitals ? (
            <p className="text-xs text-slate-400 py-4 text-center">Loading verified hospital centers...</p>
          ) : hospitals.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs text-center">
              No verified hospitals available at this moment. Please wait for an administrator to approve hospital registrations.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {hospitals.map((hosp) => {
                const isSelected = selectedHospitalId === hosp.hospital_id;
                const isLowCapacity = hosp.available_beds <= 5;
                return (
                  <div
                    key={hosp.hospital_id}
                    onClick={() => setSelectedHospitalId(hosp.hospital_id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5">
                        <Building2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                        <div>
                          <h4 className="text-sm font-bold text-navy-950">{hosp.hospital_name}</h4>
                          <p className="text-[11px] text-slate-500">{hosp.address}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{hosp.hospital_id}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold ${
                          isLowCapacity ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {hosp.available_beds} Beds Free
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Total: {hosp.total_beds} | Occ: {hosp.occupied_beds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: ROUTE SELECTION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-xs flex items-center justify-center mr-2 font-bold">4</span>
              Navigation Routing Plan
            </h3>
            {calculatingRoutes && (
              <span className="text-xs text-teal-600 flex items-center font-medium">
                <Navigation className="w-3.5 h-3.5 mr-1 animate-spin" />
                Calculating OSRM road paths...
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {routes.map((rt) => {
              const isSelected = selectedRouteName === rt.name;
              return (
                <div
                  key={rt.route_id}
                  onClick={() => setSelectedRouteName(rt.name)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedRouteName(rt.name)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-navy-950">{rt.name}</span>
                      <p className="text-[11px] text-slate-500">{rt.traffic_notice}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-extrabold text-navy-950">{rt.duration_mins} mins</span>
                    <span className="text-slate-400 ml-1.5">({rt.distance_km} km)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || hospitals.length === 0}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Transmitting Request...' : 'Transmit Emergency Request'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
