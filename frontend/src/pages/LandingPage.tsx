import React, { useState } from 'react';
import { 
  Activity, 
  Ambulance, 
  Building2, 
  ShieldCheck, 
  Navigation, 
  Bed, 
  Bell, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Radio, 
  Send, 
  MapPin, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { addToast } = useNotifications();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      addToast({
        type: 'warning',
        title: 'Incomplete Submission',
        message: 'Please complete all required fields.',
      });
      return;
    }

    setSubmittingContact(true);
    try {
      await api.submitContact(contactName, contactEmail, contactSubject, contactMessage, contactPhone);
      setContactSuccess(true);
      addToast({
        type: 'success',
        title: 'Inquiry Transmitted',
        message: 'Thank you. The MEDTRACK clinical advisory team has received your message.',
      });
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit message.',
      });
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <div className="bg-surface-50 text-slate-800">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-surface-50 to-surface-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 mr-2 rounded-full bg-teal-600 animate-ping" />
                ENTERPRISE EMERGENCY COORDINATION GRID
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-950 tracking-tight leading-[1.1]">
                Smarter Emergency Coordination.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600">
                  Better Connected Healthcare.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                MEDTRACK connects ambulance teams and hospitals through coordinated emergency requests, hospital bed availability, and real-time location visibility.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <button
                  onClick={() => onNavigate('ambulance-login')}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Ambulance Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => onNavigate('hospital-login')}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-navy-950 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  <span>Hospital Command Center</span>
                </button>
              </div>

              {/* Trust Micro-Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Verified Hospitals Only</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Immutable Unit Audits</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Zero-Delay WebSocket Feed</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Graphic / Coordination Matrix Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow backdrop */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500 to-cyan-500 opacity-20 blur-xl"></div>

                <div className="relative rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center">
                        <Activity className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy-950">Active Incident Dispatch</h3>
                        <p className="text-[11px] text-slate-500">Live Telemetry Simulation</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emergency-100 text-emergency-700">
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emergency-600 animate-ping" />
                      CRITICAL
                    </span>
                  </div>

                  {/* Route & Bed Preview Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Assigned Unit</span>
                      <span className="font-bold text-navy-900">AMB-101 (Mobile ICU)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Target Destination</span>
                      <span className="font-bold text-teal-700">Metro Trauma Center</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Available ICU Beds</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">22 Available</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Est. Siren Transit</span>
                      <span className="font-bold text-navy-900">11 mins (4.2 km)</span>
                    </div>
                  </div>

                  {/* Real-time Telemetry Pulse Indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <div className="flex items-center space-x-1.5">
                      <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                      <span>GPS Accuracy: ±8m</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">12.9780° N, 77.5850° E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEPARATE PORTALS CARDS (Section 4.E) */}
      <section id="portals" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">Dual Secure Portals</h2>
            <h3 className="text-3xl font-black text-navy-950">Engineered for Frontline Emergency Coordination</h3>
            <p className="text-slate-600 mt-2 text-sm">
              Distinct, role-tailored workspaces built specifically for mobile ambulance paramedics and hospital triage coordination desks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AMBULANCE PORTAL CARD */}
            <div className="rounded-2xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50/50 via-white to-white p-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                <Ambulance className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-black text-navy-950 mb-2">AMBULANCE PORTAL</h4>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                "Manage emergency requests and track your journey." Acquire verified device GPS coordinates, view real-time hospital bed availability, and stream en-route location updates.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Real GPS device coordinate acquisition with manual fallback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Live bed availability selector across verified regional hospitals</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Interactive turn-by-turn road routing via OSRM OpenStreetMap</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Start Journey and End Journey transition controls</span>
                </li>
              </ul>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onNavigate('ambulance-login')}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-teal-600/20"
                >
                  <span>Ambulance Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('ambulance-register')}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Register New Ambulance Unit (5 Fields) →
                </button>
              </div>
            </div>

            {/* HOSPITAL PORTAL CARD */}
            <div className="rounded-2xl border-2 border-navy-900/20 bg-gradient-to-br from-slate-50 via-white to-white p-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-navy-950 text-white flex items-center justify-center mb-6 shadow-md shadow-navy-900/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-2xl font-black text-navy-950 mb-2">HOSPITAL PORTAL</h4>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                "Receive ambulance requests and manage hospital availability." Accept or reject incoming emergencies, maintain verified bed counts, and watch moving ambulances on live maps.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Incoming emergency queue with triage level & patient info</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>One-click Accept / Reject decisions with capacity audit reason</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Server-validated Bed Management: Total, Occupied & Available</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Live tracking map displaying inbound ambulance ETA & telemetry</span>
                </li>
              </ul>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onNavigate('hospital-login')}
                  className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-black text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-navy-950/20"
                >
                  <span>Hospital Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('hospital-register')}
                  className="text-xs font-semibold text-navy-900 hover:underline"
                >
                  Register Hospital (3 Fields) →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES (Section 4.C - 8 Premium Cards) */}
      <section id="features" className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-navy-950">Mission-Critical Emergency Architecture</h3>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              Engineered to replace fragmented telephone calls with instantaneous, verified digital coordination between paramedics and hospital triage rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Emergency Request Management</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standardized triage requests covering patient age, critical emergency level, and acquisition method with server-side validation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <Bed className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Hospital Bed Availability</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Server-enforced bed formula (Available = Total - Occupied) with timestamped auditing and real-time broadcast to ambulances.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emergency-50 text-emergency-600 flex items-center justify-center mb-4">
                <Navigation className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Live Ambulance Tracking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized GPS telemetry streaming with heading, speed, accuracy circles, and stale signal warnings across Leaflet maps.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Route Visualization</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Driving route alternatives generated via OSRM OpenStreetMap, with dynamic transit rerouting options and transparent traffic disclaimers.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Instant Notifications</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bi-directional WebSocket alerts for request admissions, decisions, journey commencements, and facility approvals.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-navy-900 flex items-center justify-center mb-4">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Journey History</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive persistent logs tracking request timestamps, route changes, GPS breadcrumbs, and trauma bay handovers.
              </p>
            </div>

            {/* Card 7 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Hospital Coordination</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triage room preparation tools allowing hospitals to review incoming patient severity and assign personnel prior to arrival.
              </p>
            </div>

            {/* Card 8 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-950 mb-1.5">Secure Role-Based Access</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Granular authorization across 4 distinct roles, PBKDF2/scrypt password hashing, and mandatory admin hospital verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Section 4.D - Visual Sequence) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">Coordination Lifecycle</h2>
            <h3 className="text-3xl font-black text-navy-950">How Ambulance-to-Hospital Coordination Works</h3>
            <p className="text-slate-600 mt-2 text-sm">
              An authoritative state machine governing every second of the transfer from initial incident to emergency room intake.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <h4 className="text-sm font-bold text-navy-950 mb-2">GPS Acquisition & Request</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ambulance crew triggers browser GPS coordinate acquisition and selects patient emergency severity level.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <h4 className="text-sm font-bold text-navy-950 mb-2">Bed Capacity Inspection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Crew views verified regional hospitals with real-time available bed counts and selects target facility.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <h4 className="text-sm font-bold text-navy-950 mb-2">Hospital Decision</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hospital triage desk receives instant WebSocket chime, evaluates bay capacity, and accepts the request.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                4
              </div>
              <h4 className="text-sm font-bold text-navy-950 mb-2">Live Transit & Handover</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ambulance starts journey; hospital tracks moving siren coordinates live on map until arrival and completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST AND SECURITY SECTION (Section 4.F) */}
      <section id="security" className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center px-3 py-1 rounded-md bg-navy-900 text-teal-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                SECURITY & AUDIT ASSURANCE
              </div>

              <h3 className="text-3xl font-black text-navy-950 tracking-tight">
                Honest, Transparent Security for Healthcare Operations
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                We believe healthcare software must present clear, honest facts regarding data protection without making unsupported claims. Every protected API verifies role permissions and record ownership on the server.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-navy-950">Strict Identity Immutability</h5>
                    <p className="text-xs text-slate-600">Ambulance unit IDs and Hospital identifiers are permanently locked after registration to maintain chain-of-custody.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-navy-950">Patient Data Minimization</h5>
                    <p className="text-xs text-slate-600">Administrative overviews redact patient names to protect privacy while preserving clinical operational stats.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-navy-950">Transparent Map Disclosures</h5>
                    <p className="text-xs text-slate-600">All map tiles and navigation network topologies are sourced from OpenStreetMap contributors; simulated traffic alerts are explicitly designated.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-navy-950 rounded-2xl p-7 text-white shadow-xl border border-navy-850 space-y-4">
                <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Security Framework Checklist</span>
                </div>

                <div className="space-y-3 text-xs divide-y divide-navy-850 pt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Password Cryptography</span>
                    <span className="font-mono text-teal-400">PBKDF2 SHA-256 (600,000 iterations)</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Authentication Scheme</span>
                    <span className="font-mono text-teal-400">JWT HS256 Role-Enforced</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Hospital Onboarding Gate</span>
                    <span className="font-mono text-teal-400">Mandatory Administrator Verification</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Bed Constraint Enforcement</span>
                    <span className="font-mono text-teal-400">Server-Side Strict (Total &gt;= Occupied)</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Audit Logging</span>
                    <span className="font-mono text-teal-400">Timestamped IP Actor Trail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION (Section 4.G) */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">Hospital Network Inquiries</h2>
            <h3 className="text-3xl font-black text-navy-950">Connect with the MEDTRACK Advisory Team</h3>
            <p className="text-slate-600 mt-2 text-sm">
              Healthcare providers, regional ambulance operators, and municipal coordination centers may submit integration and deployment requests below.
            </p>
          </div>

          {contactSuccess ? (
            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
              <h4 className="text-lg font-bold text-navy-950">Inquiry Transmitted Successfully</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you for your interest in MEDTRACK. Your request has been stored in our operational database and dispatched to the clinical operations coordinator.
              </p>
              <button
                onClick={() => setContactSuccess(false)}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Dr. Sarah Connor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sconnor@hospital.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Inquiry Subject *</label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Hospital Integration Assessment"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Message Details *</label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your ambulance network or hospital bed capacity requirements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingContact ? 'Submitting...' : 'Transmit Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
