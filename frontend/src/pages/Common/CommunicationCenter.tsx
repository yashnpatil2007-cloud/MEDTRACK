import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { CommunicationMessage } from '../../types';
import { 
  Radio, 
  Send, 
  ShieldAlert, 
  Building2, 
  Ambulance, 
  Clock, 
  Tag, 
  RefreshCw, 
  CheckCircle2, 
  Volume2,
  AlertTriangle
} from 'lucide-react';

interface CommunicationCenterProps {
  onNavigateTab?: (tab: string) => void;
}

const QUICK_TAGS = [
  'Trauma Bay Needed',
  'CPR Active — En Route',
  'Vitals Stable',
  'Heavy Traffic Delay',
  'Bay 1 Ready & Staffed',
  'Oxygen Refill Needed',
  'ETA Updated (+5 mins)',
  'Pediatric Team Needed'
];

export const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [targetRecipientId, setTargetRecipientId] = useState<string>(
    user?.role === 'AMBULANCE' ? 'HOSP-METRO' : 'AMB-101'
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCommunications = async () => {
    try {
      const res = await api.getCommunications(50);
      if (res.communications) {
        setMessages(res.communications);
      }
    } catch (err: any) {
      console.error('Failed to load communication messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
    const interval = setInterval(fetchCommunications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedTag) return;

    try {
      setSending(true);
      const text = inputText.trim() || (selectedTag ? `[${selectedTag}] Transmission` : '');
      const res = await api.sendCommunication({
        recipient_id: targetRecipientId,
        message: text,
        quick_tag: selectedTag || undefined,
      });

      setInputText('');
      setSelectedTag(null);
      await fetchCommunications();

      addToast({
        title: 'Radio Transmission Dispatched',
        message: 'Message delivered to emergency coordination channel.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to send radio message:', err);
      addToast({
        title: 'Dispatch Failed',
        message: err.message || 'Unable to transmit radio signal.',
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const isAmbulance = user?.role === 'AMBULANCE';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 text-teal-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                Encrypted Emergency Radio Channel
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span>CHANNEL ACTIVE</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-navy-950 tracking-tight mt-0.5">
              Rapid Dispatch Intercom
            </h2>
            <p className="text-xs text-slate-500">
              Active Link: <span className="font-bold text-navy-900">{user?.user_id}</span> ⟷ Target:{' '}
              <span className="font-bold text-teal-700">{targetRecipientId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCommunications}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh channel messages"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK RADIO ACTION TAGS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5 flex items-center space-x-1.5">
          <Tag className="w-3.5 h-3.5 text-teal-600" />
          <span>One-Touch Emergency Radio Callouts</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedTag === tag
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-105'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT THREAD BOX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Radio className="w-8 h-8 text-teal-600 animate-pulse mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Connecting to secure frequency...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-navy-950">No radio dispatches recorded yet</p>
                <p className="text-xs text-slate-500 mt-1">Select a quick callout tag or enter a transmission below.</p>
              </div>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.sender_id === user?.user_id;
              const isAmbulanceSender = msg.sender_role === 'AMBULANCE' || msg.sender_id?.startsWith('AMB');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    {isAmbulanceSender ? (
                      <Ambulance className="w-3 h-3 text-red-500" />
                    ) : (
                      <Building2 className="w-3 h-3 text-teal-600" />
                    )}
                    <span className="font-mono font-bold text-slate-600">{msg.sender_id}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs shadow-sm ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-tr-none'
                        : 'bg-white text-navy-950 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.quick_tag && (
                      <div className="mb-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isMine
                              ? 'bg-white/20 text-white'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          ⚠️ {msg.quick_tag}
                        </span>
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.message || msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Transmission Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200">
          {selectedTag && (
            <div className="mb-2 flex items-center justify-between bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-xs text-teal-900">
              <span className="font-semibold">Attached Quick Tag: <strong>{selectedTag}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="text-teal-700 hover:text-teal-900 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={
                selectedTag
                  ? `Add details to '${selectedTag}' or hit send...`
                  : 'Type emergency dispatch message or click a quick callout above...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs rounded-xl border border-slate-200 px-4 py-3 bg-white text-navy-950 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !selectedTag)}
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Transmitting...' : 'Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
