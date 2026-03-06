import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Clock, Sparkles, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface BestTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  selectedDate: Date;
}

const RECOMMENDED_TIMES = [
  { time: '09:30', label: 'Morning Peak' },
  { time: '12:45', label: 'Lunch Break' },
  { time: '15:15', label: 'Afternoon Slump' },
  { time: '19:00', label: 'Evening Prime' },
];

export const BestTimeModal = ({ isOpen, onClose, onSelect, selectedDate }: BestTimeModalProps) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Best Times to Post Today"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Target Date</p>
            <p className="text-sm font-bold text-text">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">High Engagement</p>
            <p className="text-xs font-bold text-text-muted">Based on your audience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {RECOMMENDED_TIMES.map((item) => (
            <button
              key={item.time}
              onClick={() => {
                onSelect(item.time);
                onClose();
              }}
              className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-lg font-black text-text">{item.time} <span className="text-xs font-medium text-text-muted uppercase ml-1">{parseInt(item.time) >= 12 ? 'PM' : 'AM'}</span></p>
                  <p className="text-xs text-text-muted font-medium">{item.label}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/20 transition-all">
                <Sparkles size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-text-muted text-center leading-relaxed px-4">
          Recommendations are calculated based on your historical engagement data and platform-specific peak activity periods.
        </p>

        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
