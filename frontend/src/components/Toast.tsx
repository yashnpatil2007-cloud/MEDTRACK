import React from 'react';
import { useNotifications, ToastMessage } from '../context/NotificationContext';
import { AlertTriangle, CheckCircle2, Info, X, Siren } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'emergency':
        return <Siren className="w-5 h-5 text-emergency-500 animate-pulse flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-emergency-500 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-600 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'emergency':
        return 'border-emergency-500 bg-white ring-2 ring-emergency-500/20 shadow-xl';
      case 'success':
        return 'border-teal-500 bg-white shadow-lg';
      case 'warning':
        return 'border-amber-400 bg-white shadow-lg';
      case 'error':
        return 'border-emergency-400 bg-white shadow-lg';
      default:
        return 'border-cyan-500 bg-white shadow-lg';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start p-4 rounded-xl border transition-all duration-300 transform translate-y-0 opacity-100 ${getBorderColor()}`}
    >
      <div className="mt-0.5 mr-3">{getIcon()}</div>
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-semibold text-navy-900">{toast.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
