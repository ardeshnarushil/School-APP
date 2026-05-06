import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Calendar = ({ onDateSelect, selectedDate }) => {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef(null);
  
  // Helper to get relative days around selected/today
  const getDaysArray = (baseDate) => {
    const days = [];
    const start = new Date(baseDate);
    start.setDate(start.getDate() - 3); // Show 3 days before
    
    for (let i = 0; i < 30; i++) { // Generate a month's worth for scrolling
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return days;
  };

  const [days, setDays] = useState(getDaysArray(selectedDate || new Date()));

  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  const toGujarati = (num) => {
    if (i18n.language !== 'gu') return num;
    return String(num).split('').map(digit => gujaratiDigits[parseInt(digit)] || digit).join('');
  };

  const dayNamesEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayNamesGu = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
  const dayNames = i18n.language === 'gu' ? dayNamesGu : dayNamesEn;

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesGu = [
    "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
    "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
  ];
  const monthNames = i18n.language === 'gu' ? monthNamesGu : monthNamesEn;

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateSelect(newDate);
    setDays(getDaysArray(newDate));
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateSelect(newDate);
    setDays(getDaysArray(newDate));
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl w-full max-w-sm mx-auto animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-xl font-black text-slate-800">
          {monthNames[selectedDate.getMonth()]} {toGujarati(selectedDate.getFullYear())}
        </h3>
        <div className="flex gap-4">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-1 overflow-hidden">
        {days.slice(0, 5).map((date, idx) => {
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={`flex flex-col items-center gap-3 py-4 px-3 min-w-[60px] rounded-3xl transition-all duration-300
                ${isSelected 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110 -translate-y-1' 
                  : 'bg-transparent text-slate-400 hover:bg-slate-50'}
              `}
            >
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                {dayNames[date.getDay()]}
              </span>
              <span className="text-lg font-black">
                {toGujarati(date.getDate())}
              </span>
              {isToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
