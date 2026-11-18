import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Mail, User, Clock, Phone } from 'lucide-react';

export const ContactMessagesView: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.getContactMessages();
        setMessages(res.messages);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Inbound Communications</span>
        <h2 className="text-2xl font-black text-navy-950 tracking-tight">Public Inquiry Messages</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Inquiries received from prospective hospital partners, municipal dispatchers, and ambulance operators.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-xs text-slate-400 p-8 text-center">Loading inquiries...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-400 p-12 text-center">No inquiry messages submitted yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((m) => (
              <div key={m.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-navy-950 text-sm">{m.name}</span>
                    <span className="text-xs text-teal-700 font-medium">&lt;{m.email}&gt;</span>
                    {m.phone && (
                      <span className="text-xs text-slate-400 font-mono flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {m.phone}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs font-semibold text-navy-900">{m.subject}</div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
