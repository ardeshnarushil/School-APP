import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Calendar = ({ onDateSelect, selectedDate }) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  
  const toGujarati = (num) => {
    if (i18n.language !== 'gu') return num;
    return String(num).split('').map(digit => gujaratiDigits[parseInt(digit)] || digit).join('');
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Empty slots for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(date)}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm transition-all
            ${isSelected ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 'text-slate-600 font-medium hover:bg-primary/10 hover:text-primary'}
            ${isToday && !isSelected ? 'border border-primary/30 text-primary' : ''}
          `}
        >
          {toGujarati(day)}
        </button>
      );
    }

    return days;
  };

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthNamesGu = [
    "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
    "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
  ];

  const monthNames = i18n.language === 'gu' ? monthNamesGu : monthNamesEn;
  const dayNamesEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNamesGu = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
  const dayNames = i18n.language === 'gu' ? dayNamesGu : dayNamesEn;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-lg font-bold text-slate-800">
          {monthNames[currentMonth.getMonth()]} {toGujarati(currentMonth.getFullYear())}
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {dayNames.map((day, idx) => (
          <div key={idx} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;
