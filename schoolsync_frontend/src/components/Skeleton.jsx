import React from 'react';

const Skeleton = ({ type = 'table' }) => {
  if (type === 'table') {
    return (
      <div className="w-full space-y-4 animate-pulse p-4">
        <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-50 rounded w-1/4"></div>
              <div className="h-3 bg-slate-50 rounded w-1/6"></div>
            </div>
            <div className="w-24 h-8 bg-slate-50 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-50 rounded-3xl border-2 border-slate-100/50"></div>
        ))}
      </div>
    );
  }

  return <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>;
};

export default Skeleton;
