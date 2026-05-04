import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmText = "Delete",
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
          
          <div className="mt-10 flex gap-4">
            <button 
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
        <div className="bg-slate-50 py-4 px-8 text-center border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Protocol Active</p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
