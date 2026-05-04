import React from 'react';
import { BookOpen } from 'lucide-react';

const Loader = ({ fullPage = true }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce">
          <BookOpen size={36} />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">SchoolSync</h2>
        <p className="text-slate-400 font-medium text-sm uppercase tracking-[0.2em] mt-1">Preparing your workspace</p>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-64 flex items-center justify-center">
      {content}
    </div>
  );
};

export default Loader;
