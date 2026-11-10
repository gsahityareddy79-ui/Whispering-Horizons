import React, { useState, useEffect } from 'react';
import { X, Feather, Send, MessageSquare, BookOpen } from 'lucide-react';
import { Landmark } from '../game/types';

interface VisitorNote {
  id: string;
  author: string;
  message: string;
  location: string;
  timestamp: number;
}

interface NoteModalProps {
  landmark: Landmark;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ landmark, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lore' | 'visitorLog'>('lore');
  const [visitorNotes, setVisitorNotes] = useState<VisitorNote[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Fetch community drift bottle messages from our backend
    fetch('/api/island/notes')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data && Array.isArray(data.notes)) {
          setVisitorNotes(data.notes);
        }
      })
      .catch((err) => console.log('Notes API status:', err));
  }, []);

  const handleSendBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/island/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'Nameless Wanderer',
          message: newMessage.trim(),
          location: landmark.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setVisitorNotes((prev) => [data.note, ...prev]);
        }
        setNewMessage('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (e) {
      console.warn('Could not post drift note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 select-none">
      <div
        className="relative w-full max-w-lg bg-[#f7eed9] text-[#2c2216] rounded-2xl p-6 sm:p-8 shadow-2xl border-4 border-[#c7b28f] overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(180, 150, 110, 0.25)',
        }}
      >
        {/* Parchment Corner Ornamentation */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#e6d6b8] -rotate-45 transform origin-top-right border-b border-[#c7b28f]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#dfceb0] hover:bg-[#d0bfa0] text-[#4a3b2b] flex items-center justify-center transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#dbc4a1] pb-3">
          <button
            onClick={() => setActiveTab('lore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'lore'
                ? 'bg-[#4a3622] text-[#f7eed9]'
                : 'text-[#6e583f] hover:text-black'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Island Chronicle</span>
          </button>

          <button
            onClick={() => setActiveTab('visitorLog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'visitorLog'
                ? 'bg-[#4a3622] text-[#f7eed9]'
                : 'text-[#6e583f] hover:text-black'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Drift Bottles ({visitorNotes.length})</span>
          </button>
        </div>

        {/* Tab 1: Historical Lore Note */}
        {activeTab === 'lore' && landmark.noteContent && (
          <div className="space-y-4">
            <div className="border-b border-[#e2cca8] pb-3">
              <div
                className="text-lg sm:text-xl font-bold tracking-wide text-[#3d2a17]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {landmark.noteContent.header}
              </div>
              <div className="text-xs text-[#826a4c] font-medium tracking-wide">
                Recorded at {landmark.title}
              </div>
            </div>

            <div className="text-sm sm:text-base leading-relaxed text-[#3a2e22] whitespace-pre-line font-serif italic py-1">
              {landmark.noteContent.body}
            </div>

            <div className="pt-4 border-t border-[#e2cca8] flex items-center justify-between text-xs text-[#66513a]">
              <div>
                <span className="font-semibold">{landmark.noteContent.author}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#7a644c]">
                <Feather className="w-3 h-3" />
                <span>{landmark.noteContent.date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Wanderer Drift Bottles (Online Feature) */}
        {activeTab === 'visitorLog' && (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            <form onSubmit={handleSendBottle} className="bg-[#ede2ca] p-3 rounded-xl border border-[#dbc6a4] space-y-2">
              <div className="text-xs font-semibold uppercase text-[#54402c] tracking-wider">
                Cast a Drift Bottle from {landmark.title}
              </div>
              <input
                type="text"
                placeholder="Your explorer name (optional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={24}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-[#faf4e6] border border-[#d2bd9a] text-[#2c2216] focus:outline-none focus:border-[#4a3622]"
              />
              <textarea
                placeholder="Leave words for future voyagers to find..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={240}
                rows={2}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-[#faf4e6] border border-[#d2bd9a] text-[#2c2216] focus:outline-none focus:border-[#4a3622] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#7d6851]">
                  {submitSuccess ? '✓ Message cast to the tide!' : 'Preserved on the island server'}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !newMessage.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#4a3622] hover:bg-[#382818] disabled:opacity-50 text-[#f7eed9] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5 pt-1">
              {visitorNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-[#faf4e6] p-3 rounded-xl border border-[#ded0b6] shadow-sm text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#705b45]">
                    <span className="font-bold text-[#3d2c1c]">{note.author}</span>
                    <span className="text-[10px] text-[#8c755c]">{note.location}</span>
                  </div>
                  <p className="text-[#3c3022] italic leading-relaxed">
                    "{note.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#4a3622] hover:bg-[#382818] text-[#f7eed9] text-xs font-semibold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
          >
            Continue Journey
          </button>
        </div>
      </div>
    </div>
  );
};
