import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Hospital, EmergencyRequest } from '../../types';
import { 
  Building2, 
  Bed, 
  MapPin, 
  Clock, 
  Route, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Phone, 
  Navigation,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface NearbyHospitalsViewProps {
  onNavigateTab: (tab: string) => void;
}

export const NearbyHospitalsView: React.FC<NearbyHospitalsViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBeds, setFilterBeds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectingHospitalId, setSelectingHospitalId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hospRes, reqRes] = await Promise.all([
        api.getHospitals(),
        api.getRequests(),
      ]);

      setHospitals(hospRes.hospitals || []);
      const active = reqRes.requests.find(
        (r) => r.status === 'ACCEPTED' || 
               r.status === 'BOOKED' || 
               r.status === 'PATIENT PICKED UP' || 
               r.status === 'PENDING' ||
               r.status === 'ON JOURNEY' || 
               r.status === 'JOURNEY_ACTIVE'
      );
      setActiveRequest(active || null);
    } catch (err: any) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectHospital = async (hospital: Hospital) => {
    try {
      setSelectingHospitalId(hospital.hospital_id);
      if (activeRequest) {
        await api.updateRequestDestination(activeRequest.request_id, hospital.hospital_id);
        addToast({
          title: 'Destination Set',
          message: `Destination updated to ${hospital.hospital_name}. Calculating optimal routes...`,
          type: 'success',
        });
      }
      // Navigate to route planning tab
      onNavigateTab('route');
    } catch (err: any) {
      console.error('Failed to update destination:', err);
      // Fallback: navigate anyway
      onNavigateTab('route');
    } finally {
      setSelectingHospitalId(null);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hospital_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBeds = filterBeds ? h.available_beds > 0 : true;
    return matchesSearch && matchesBeds && h.verification_status === 'APPROVED';
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Regional Healthcare Grid</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Nearby Hospital Facilities</h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified emergency centers with live trauma bed capacity and priority admission access
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeRequest && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Patient</span>
              <div className="text-xs font-bold text-navy-900">{activeRequest.patient_name || 'Patient'} ({activeRequest.emergency_level})</div>
            </div>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh bed capacity"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hospital name, ID, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          onClick={() => setFilterBeds(!filterBeds)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border flex-shrink-0 ${
            filterBeds
              ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Only Available Beds</span>
        </button>
      </div>

      {/* HOSPITAL CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-8 h-8 text-teal-600 animate-pulse mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Querying Regional Hospital Capacities...</p>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-navy-950">No verified hospitals match your filter</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting search filters or checking network connectivity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hospital) => {
            const isCurrentlyAssigned = activeRequest?.hospital_id === hospital.hospital_id;
            const bedPercentage = Math.round((hospital.available_beds / (hospital.total_beds || 1)) * 100);

            return (
              <div
                key={hospital.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  isCurrentlyAssigned
                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {hospital.hospital_id}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                        <span>Verified Trauma Center</span>
                      </span>
                    </div>
                  </div>

                  {/* Hospital Name & Address */}
                  <h3 className="text-base font-bold text-navy-950 leading-snug">{hospital.hospital_name}</h3>
                  <div className="flex items-start space-x-1.5 mt-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </div>

                  {/* Bed Capacity Indicator */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold flex items-center space-x-1.5">
                        <Bed className="w-3.5 h-3.5 text-teal-600" />
                        <span>Emergency Bed Capacity</span>
                      </span>
                      <span className={`font-black ${hospital.available_beds > 5 ? 'text-teal-700' : hospital.available_beds > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {hospital.available_beds} Available / {hospital.total_beds} Total
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          hospital.available_beds > 5 ? 'bg-teal-500' : hospital.available_beds > 0 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(8, bedPercentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Distance & Transit metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated ETA</span>
                      <span className="font-bold text-navy-900">~9-12 mins</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Corridor Priority</span>
                      <span className="font-bold text-teal-700">Level 1 Green</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleSelectHospital(hospital)}
                    disabled={selectingHospitalId === hospital.hospital_id}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                      isCurrentlyAssigned
                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
                        : 'bg-navy-900 hover:bg-navy-950 text-white'
                    }`}
                  >
                    <Route className="w-4 h-4" />
                    <span>
                      {isCurrentlyAssigned
                        ? 'Current Destination — Plan Route'
                        : 'Select Hospital & Plan Route'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
