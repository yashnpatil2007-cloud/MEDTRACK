import React, { useState } from 'react';
import { Activity, ShieldCheck, Heart, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

export const Footer: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-navy-850 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-navy-850">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                MED<span className="text-teal-400">TRACK</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connecting Ambulances. Empowering Hospitals. Saving Time. Premium cloud coordination grid built for mission-critical emergency transport.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Role-Enforced Hospital Authorization</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Emergency Coordination</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Bed Capacity Management</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Live GPS Telemetry</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Coordination Workflow</a></li>
            </ul>
          </div>

          {/* Verification & Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Access Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300 font-semibold">Ambulance Portal:</span> Active request & tracking</li>
              <li><span className="text-slate-300 font-semibold">Hospital Command:</span> Bed availability & queue</li>
              <li><span className="text-slate-300 font-semibold">Administrator:</span> Credential verification & audit</li>
              <li><span className="text-slate-300 font-semibold">Super Admin:</span> Platform health & provisioning</li>
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Compliance & Trust</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Protected authentication, immutable identifiers, sanitized patient privacy representations, and transparent map data disclosures.
            </p>
            <div className="flex space-x-4 text-xs">
              <button 
                onClick={() => setLegalModal('privacy')}
                className="text-teal-400 hover:underline"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setLegalModal('terms')}
                className="text-teal-400 hover:underline"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        {/* Bottom disclosure & copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} MEDTRACK Emergency Coordination System. All rights reserved.</p>
          <p className="text-center sm:text-right text-[11px] max-w-md">
            Cartography via OpenStreetMap contributors. Live routing powered by OSRM. Simulated traffic alerts are explicitly designated.
          </p>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title="MEDTRACK Patient Privacy & Telemetry Policy"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <p className="font-semibold text-navy-950">1. Data Minimization Principles</p>
          <p>
            MEDTRACK collects only the clinical details strictly necessary to prepare hospital emergency trauma rooms for patient intake. Non-clinical administrative overviews redact direct patient identifiers to protect patient privacy.
          </p>
          <p className="font-semibold text-navy-950">2. GPS Telemetry and Active Journey Tracking</p>
          <p>
            Geolocation updates are transmitted only during active, authorized emergency transfers. Ambulance crew coordinates are not tracked when units are offline or in off-duty status.
          </p>
          <p className="font-semibold text-navy-950">3. Immutable Account Identifiers</p>
          <p>
            To guarantee clinical chain-of-custody and prevent identity tampering, user IDs, ambulance unit IDs, and hospital registrations cannot be altered after creation.
          </p>
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title="MEDTRACK Terms of Operational Service"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <p className="font-semibold text-navy-950">1. Hospital Verification Requirement</p>
          <p>
            All registered hospital facilities must be formally verified and approved by a system administrator prior to accepting emergency transfer requests or participating in live grid routing.
          </p>
          <p className="font-semibold text-navy-950">2. Bed Availability Accuracy</p>
          <p>
            Hospitals are responsible for maintaining timely, accurate reports of available trauma and intensive care beds. Available bed calculations are automatically computed as Total Beds minus Occupied Beds.
          </p>
          <p className="font-semibold text-navy-950">3. Map & Routing Providers</p>
          <p>
            Navigation routing is generated using OpenStreetMap network topologies via OSRM. Live traffic congestion warnings without direct sensor feeds are designated as SIMULATED ADVISORIES.
          </p>
        </div>
      </Modal>
    </footer>
  );
};
