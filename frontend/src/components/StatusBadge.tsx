import React from 'react';
import { EmergencyLevel, RequestStatus } from '../types';

interface StatusBadgeProps {
  status?: RequestStatus | string;
  level?: EmergencyLevel;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, level, className = '' }) => {
  if (level) {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emergency-100 text-emergency-700 border border-emergency-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emergency-600 animate-ping" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400" />
            LOW
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'PENDING':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-teal-600" />
            Accepted
          </span>
        );
      case 'BOOKED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500" />
            Booked
          </span>
        );
      case 'PATIENT PICKED UP':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-cyan-600" />
            Patient Picked Up
          </span>
        );
      case 'ON JOURNEY':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-600 animate-ping" />
            On Journey
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case 'JOURNEY_ACTIVE':
      case 'ACTIVE':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-cyan-600 animate-ping" />
            Journey Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
            Cancelled
          </span>
        );
      case 'APPROVED':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
            Verified & Approved
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            {status}
          </span>
        );
    }
  }

  return null;
};
