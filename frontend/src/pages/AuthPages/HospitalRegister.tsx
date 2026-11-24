import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Bed, 
  Phone, 
  Sparkles, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { REAL_HOSPITAL_PRESETS, HospitalPreset } from '../../data/hospitalPresets';
import { LocationPickerMap } from '../../components/LocationPickerMap';

interface HospitalRegisterProps {
  onNavigate: (page: string) => void;
}

export const HospitalRegister: React.FC<HospitalRegisterProps> = ({ onNavigate }) => {
  const { registerHospital } = useAuth();
  const { addToast } = useNotifications();

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('HOSP-RUBY');

  // Hospital Details
  const [hospitalName, setHospitalName] = useState('Ruby Hall Clinic');
  const [hospitalId, setHospitalId] = useState('HOSP-RUBY');
  const [password, setPassword] = useState('Hospital@123');
  const [phone, setPhone] = useState('+91 20 6645 5100');

  // Location Details (Real Google Maps Aligned)
  const [address, setAddress] = useState('40, Sassoon Road, Sangamvadi, Pune, Maharashtra 411001');
  const [latitude, setLatitude] = useState<number>(18.5326);
  const [longitude, setLongitude] = useState<number>(73.8777);

  // Capacity Details
  const [totalBeds, setTotalBeds] = useState<number>(120);
  const [occupiedBeds, setOccupiedBeds] = useState<number>(78);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredPending, setRegisteredPending] = useState(false);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'CUSTOM') {
      setHospitalName('');
      setHospitalId('');
      setAddress('');
      setLatitude(18.5204);
      setLongitude(73.8567);
      setTotalBeds(50);
      setOccupiedBeds(20);
      setPhone('');
      return;
    }

    const preset = REAL_HOSPITAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setHospitalName(preset.name);
      setHospitalId(preset.id);
      setAddress(preset.address);
      setLatitude(preset.latitude);
      setLongitude(preset.longitude);
      setTotalBeds(preset.totalBeds);
      setOccupiedBeds(preset.occupiedBeds);
      setPhone(preset.phone);

      addToast({
        type: 'info',
        title: 'Google Maps Location Loaded',
        message: `Applied verified coordinates for ${preset.name}.`,
      });
    }
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hospitalName.trim() || !hospitalId.trim() || !password) {
      setErrorMsg('Hospital Name, Hospital ID, and Password are required.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Physical facility address is required for ambulance navigation.');
      return;
    }

    setLoading(true);
    try {
      await registerHospital({
        hospital_name: hospitalName.trim(),
        hospital_id: hospitalId.trim(),
        password,
        address: address.trim(),
        latitude,
        longitude,
        total_beds: Number(totalBeds) || 50,
        occupied_beds: Number(occupiedBeds) || 20,
        phone_number: phone.trim(),
      });

      addToast({
        type: 'success',
        title: 'Hospital Facility Registered',
        message: 'Facility details and coordinates submitted for verification.',
        duration: 8000,
      });

      setRegisteredPending(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hospital registration failed.');
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Unable to register hospital.',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 bg-surface-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3 shadow-sm border border-cyan-100">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Center Registration</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Register your facility with real-world Google Maps GPS coordinates and active bed telemetry for incoming emergency ambulances.
          </p>
        </div>

        {registeredPending ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
            <Clock className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-navy-950">Registration Submitted For Verification</h3>
            <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto">
              Hospital <b>{hospitalName}</b> (ID: <code>{hospitalId}</code>) at <b>{address}</b> has been recorded. An Administrator will verify facility credentials before you participate in regional ambulance dispatch.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full py-3 rounded-xl bg-navy-950 text-white font-bold text-xs hover:bg-black transition-colors shadow-md"
              >
                Access Hospital Workspace (Pending Mode)
              </button>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION: PRESET SELECTOR (REAL GOOGLE MAPS HOSPITALS) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/60 to-teal-50/60 border border-cyan-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-navy-950 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                    <span>Quick-Select Verified Hospital on Google Maps</span>
                  </label>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                    GPS & Beds Pre-filled
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Select a real-world hospital to auto-fill verified Google Maps coordinates, or choose "Custom Facility" to enter your own:
                </p>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cyan-300 text-xs font-semibold text-navy-950 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="CUSTOM">➕ Custom Facility / Add Other Real Hospital Location</option>
                  <optgroup label="Pune & Maharashtra Verified Hospitals">
                    {REAL_HOSPITAL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.address.split(',')[0]} — {p.city})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* SECTION 1: FACILITY IDENTIFICATION */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  1. Facility Identification & Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                      Hospital Facility Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. Ruby Hall Clinic"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-navy-950 uppercase">
                        Hospital ID *
                      </label>
                      <span className="text-[10px] text-amber-600 font-semibold">Unique ID</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="e.g. HOSP-RUBY"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                      Security Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                      Emergency Desk Hotline / Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 20 6645 5100"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PHYSICAL ADDRESS & REAL GOOGLE MAPS LOCATION */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Location & Google Maps Alignment</span>
                  <span className="text-[10px] text-teal-700 font-semibold font-sans">
                    Ambulance ETA calculates to this coordinate
                  </span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                    Street Address & Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 40, Sassoon Road, Sangamvadi, Pune, Maharashtra 411001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                  />
                </div>

                {/* Interactive Map Pinning */}
                <div>
                  <LocationPickerMap
                    latitude={latitude}
                    longitude={longitude}
                    onChange={handleMapLocationChange}
                    height="240px"
                    markerTitle={hospitalName || 'Hospital Entrance'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Latitude (GPS Decimal)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Longitude (GPS Decimal)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: BED CAPACITY */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    3. Emergency Bed Capacity
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {availableBeds} Beds Ready for Triage
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                      Total Inpatient Beds
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalBeds}
                      onChange={(e) => setTotalBeds(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                      Currently Occupied Beds
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalBeds}
                      required
                      value={occupiedBeds}
                      onChange={(e) => setOccupiedBeds(Math.min(totalBeds, Math.max(0, Number(e.target.value))))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <b>Administrator Verification Protocol:</b> Once registered, an admin verifies the facility license and hospital registry. You can immediately log in and manage bed statuses in preview mode.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-navy-950 hover:bg-black active:scale-98 shadow-md shadow-navy-950/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Registering Facility...' : 'Complete Hospital Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('hospital-login')}
              className="font-bold text-navy-900 hover:underline"
            >
              Sign In to Hospital Portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
