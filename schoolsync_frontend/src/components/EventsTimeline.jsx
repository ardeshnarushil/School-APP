import React from 'react';
import { Calendar, Bell, Award, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EventsTimeline = ({ events }) => {
  const { t, i18n } = useTranslation();

  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  const toGujarati = (num) => {
    if (i18n.language !== 'gu' || num === null || num === undefined) return num;
    return String(num).split('').map(digit => gujaratiDigits[parseInt(digit)] || digit).join('');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center">
        <Calendar className="mx-auto text-slate-200 mb-3" size={40} />
        <p className="text-slate-400 font-medium">{t('no_upcoming_events') || 'No upcoming events'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-slate-100 before:to-transparent">
      {events.map((event, index) => (
        <div key={index} className="relative flex items-start gap-6 group">
          <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110 ${event.type === 'exam' ? 'bg-primary text-white' : 'bg-amber-100 text-amber-600'
            }`}>
            {event.type === 'exam' ? <Award size={18} /> : <Megaphone size={18} />}
          </div>
          <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${event.type === 'exam' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                }`}>
                {event.type === 'exam' ? t('exam') : t('announcement')}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {formatDate(event.date)}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 leading-tight mb-1">{event.title}</h4>
            <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsTimeline;
