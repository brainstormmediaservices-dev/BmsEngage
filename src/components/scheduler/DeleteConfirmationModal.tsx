import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Post", 
  message = "Are you sure you want to delete this post? This action cannot be undone." 
}: DeleteConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-text">{title}</p>
            <p className="text-xs text-text-muted leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={18} className="mr-2" /> Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
