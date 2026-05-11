import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api';
import { 
  User, Calendar as CalendarIcon, Clock, Bell, BookOpen, LogOut, 
  CheckCircle, XCircle, RefreshCw, Megaphone, Settings, X, ClipboardCheck, GraduationCap, Award, Languages, LayoutDashboard, Menu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Calendar from '../../components/Calendar';
import Loader from '../../components/Loader';
import EventsTimeline from '../../components/EventsTimeline';

/**
 * ParentDashboard Component
 * Refactored for cleaner structure and better readability.
 * Maintains all original functionality.
 */
const ParentDashboard = () => {
  const { t, i18n } = useTranslation();

  // --- UTILITIES ---
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(newLang);
  };
  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  const toGujarati = (num) => {
    if (i18n.language !== 'gu' || num === null || num === undefined) return num;
    return String(num).split('').map(digit => gujaratiDigits[parseInt(digit)] || digit).join('');
  };

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data States
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Selection States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHomeworkDate, setSelectedHomeworkDate] = useState(new Date());
  const [selectedDayAttendance, setSelectedDayAttendance] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceForDate();
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'homework') fetchHomework(selectedHomeworkDate);
  }, [activeTab, selectedHomeworkDate]);

  const fetchInitialData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, homeworkRes, attendanceRes, noticesRes, notifRes] = await Promise.all([
        api.get('/api/dashboard-stats/'),
        api.get('/api/homework/'),
        api.get('/api/attendance/'),
        api.get('/api/notices/'),
        api.get('/api/notifications/')
      ]);

      let resultsData = [];
      try {
        const resultsRes = await api.get('/api/results/');
        resultsData = resultsRes.data;
      } catch (rErr) {
        console.warn('Results not available');
      }

      setData({ ...statsRes.data, results: resultsData });
      setHomework(homeworkRes.data);
      setAttendanceRecords(attendanceRes.data);
      setNotices(noticesRes.data);
      setNotifications(notifRes.data);
      
      // Initial attendance status for today
      const dateStr = selectedDate.toISOString().split('T')[0];
      const record = attendanceRes.data.find(r => r.date === dateStr);
      setSelectedDayAttendance(record ? record.status : 'Not Available');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAttendanceForDate = async () => {
    setRefreshing(true);
    setSelectedDayAttendance('Loading...');
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await api.get(`/api/attendance/?date=${dateStr}`);
      setSelectedDayAttendance(res.data.length > 0 ? res.data[0].status : 'Not Available');
    } catch (err) {
      setSelectedDayAttendance('Error');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchHomework = async (date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get(`/api/homework/?date=${dateStr}`);
      setHomework(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const getUpcomingEvents = () => {
    const events = [];
    data?.exams?.forEach(exam => {
      exam.subjects?.forEach(subject => {
        if (subject.exam_date) {
          events.push({
            type: 'exam', date: subject.exam_date,
            title: `${exam.name}: ${subject.subject_name}`,
            description: `${t('max_marks')}: ${toGujarati(subject.max_marks)} | ${subject.start_time} - ${subject.end_time}`
          });
        }
      });
    });
    notices?.forEach(notice => {
      events.push({ type: 'announcement', date: notice.created_at, title: t('announcement'), description: notice.content });
    });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date)).filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0));
  };

  if (loading) return <Loader />;

  const child = data?.children?.[0];

  // --- RENDER HELPERS ---
  const renderSidebar = () => (
    <div className="hidden lg:block w-64 space-y-2">
      {[
        { id: 'overview', icon: LayoutDashboard, label: t('overview') },
        { id: 'notifications', icon: Bell, label: t('notifications') },
        { id: 'attendance', icon: CalendarIcon, label: t('attendance_history') },
        { id: 'homework', icon: BookOpen, label: t('homework') },
        { id: 'results', icon: ClipboardCheck, label: t('exam_results') },
        { id: 'exam-timetable', icon: CalendarIcon, label: t('exam_timetable') },
      ].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'sidebar-link-active' : 'sidebar-link bg-white'} w-full`}><tab.icon size={20} /> {tab.label}</button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3"><div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center"><BookOpen size={18} /></div><span className="text-lg md:text-xl font-bold text-primary">SchoolSync</span></div>
        <div className="flex items-center gap-3 md:gap-10">
          <button onClick={toggleLanguage} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-[2rem] text-xs md:text-sm font-bold text-slate-700"><Languages size={16} className="text-primary" />{i18n.language === 'en' ? 'GUJ' : 'ENG'}</button>
          <div onClick={() => window.location.href = '/profile'} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-primary border border-slate-200 cursor-pointer"><User size={18} /></div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500"><LogOut size={18} /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-10 pb-24 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {renderSidebar()}

          <div className="flex-1 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {data?.announcement && (
              <div className="bg-primary text-white p-6 md:p-10 rounded-[2.5rem] flex items-center gap-6 shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-md"><Megaphone size={24} /></div>
                <div><p className="text-[10px] uppercase font-bold opacity-70 mb-1">{t('administrator_announcement')}</p><p className="text-sm md:text-lg font-medium">{data.announcement}</p></div>
              </div>
            )}

            {child && (
              <div onClick={() => setViewingStudent({...child, class_name: child.class_name})} className="bg-white border border-slate-200 p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center shadow-sm cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-6 md:gap-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50">{child.profile_picture ? <img src={getImageUrl(child.profile_picture)} className="w-full h-full object-cover" /> : <User size={24} className="opacity-30" />}</div>
                  <div><h2 className="text-xl md:text-3xl font-bold text-slate-800">{child.name}</h2><p className="text-slate-500 font-medium uppercase text-[10px] md:text-sm">{t('class')} {toGujarati(child.class_name)} • {t('roll_number')}: {toGujarati(child.roll_number)}</p></div>
                </div>
                <div className="hidden md:flex bg-slate-50 px-6 py-3 rounded-full border border-slate-100 items-center gap-2 text-green-500 font-bold"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{t('enrolled')}</div>
              </div>
            )}

            {/* TAB CONTENT */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6"><h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><CalendarIcon className="text-primary" /> {t('school_events_timeline')}</h3><EventsTimeline events={getUpcomingEvents()} /></div>
                <div className="space-y-6"><h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><Award className="text-primary" /> {t('upcoming_exams')}</h3><div className="grid gap-4">{data?.exams?.filter(ex => ex.is_visible).slice(0, 3).map(exam => (<div key={exam.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"><h4 className="font-bold text-slate-800">{exam.name}</h4><p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{toGujarati(exam.subjects?.length)} {t('subjects')}</p></div>))}</div></div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-800">{t('notifications')}</h2><button onClick={fetchInitialData} className="p-2 hover:bg-slate-100 rounded-full"><RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} /></button></div>
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 flex gap-5 items-start shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0"><Bell size={24} /></div>
                    <div className="flex-1"><div className="flex justify-between mb-1"><h4 className="font-bold text-slate-800">{notif.title}</h4><span className="text-[10px] text-slate-400 uppercase">{new Date(notif.created_at).toLocaleDateString()}</span></div><p className="text-slate-500 text-sm leading-relaxed">{notif.message}</p></div>
                  </div>
                )) : <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed text-slate-300 font-bold">No new notifications</div>}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-auto"><Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} /></div>
                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><CheckCircle className="text-primary" /> {t('attendance_details')}</h3>
                  <div className="bg-slate-50 p-10 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden">
                    {refreshing && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><Loader fullPage={false} /></div>}
                    <p className="text-slate-500 uppercase text-xs font-bold mb-2">{t('selected_date')}</p>
                    <p className="text-xl font-bold mb-6">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className={`text-3xl font-black px-10 py-5 rounded-full border-4 ${selectedDayAttendance === 'PRESENT' ? 'bg-green-50 text-green-600 border-green-200' : selectedDayAttendance === 'ABSENT' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{selectedDayAttendance}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'homework' && (
              <div className="space-y-10">
                <Calendar onDateSelect={setSelectedHomeworkDate} selectedDate={selectedHomeworkDate} />
                <div className="grid grid-cols-1 gap-4">
                  {homework.map(item => (<div key={item.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"><div><h4 className="text-lg font-bold text-slate-800">{item.title}</h4><p className="text-xs font-semibold text-slate-400">{t('due_date')}: {item.due_date}</p><p className="text-slate-600 text-sm mt-3">{item.description}</p></div></div>))}
                  {homework.length === 0 && <div className="p-24 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed text-slate-300 font-bold">No assignments found</div>}
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-slate-800">{t('academic_results')}</h2><button onClick={fetchInitialData} className="p-2 hover:bg-slate-100 rounded-lg"><RefreshCw size={20} /></button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{data?.exams?.filter(e => e.is_visible).map(exam => (<div key={exam.id} onClick={() => setSelectedExam(exam)} className={`p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer ${selectedExam?.id === exam.id ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-white border-slate-100 hover:bg-slate-50'}`}><div className="flex items-center gap-4"><Award size={28} /><div><h4 className="font-bold text-lg">{exam.name}</h4><p className="text-xs opacity-70">{t('click_to_view_marksheet')}</p></div></div></div>))}</div>
                {selectedExam && (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden"><div className="bg-primary p-10 text-white flex justify-between items-center"><div><h3 className="text-4xl font-black">{selectedExam.name}</h3><p className="opacity-70">{t('academic_performance_record')}</p></div><div className="bg-white/20 p-6 rounded-[2rem] text-center"><p className="text-xs font-bold uppercase opacity-70">Grade</p><p className="text-3xl font-black">{(() => { const res = data?.results?.filter(r => r.exam_id === selectedExam.id) || []; const pct = res.reduce((a,r)=>a+r.max_marks,0) > 0 ? (res.reduce((a,r)=>a+r.obtained_marks,0)/res.reduce((a,r)=>a+r.max_marks,0))*100 : 0; return pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : 'C'; })()}</p></div></div>
                    <div className="p-10 overflow-x-auto"><table className="w-full"><thead><tr className="text-left border-b-2 border-slate-100"><th className="pb-6 text-xs font-black text-slate-400 uppercase">Subject</th><th className="pb-6 text-center text-xs font-black text-slate-400 uppercase">Max</th><th className="pb-6 text-right text-xs font-black text-slate-400 uppercase">Obtained</th></tr></thead><tbody className="divide-y divide-slate-50">{(data?.results?.filter(r => r.exam_id === selectedExam.id) || []).map(res => (<tr key={res.id} className="hover:bg-slate-50/50 transition-colors"><td className="py-6 font-bold text-slate-700 text-lg">{res.subject_name}</td><td className="py-6 text-center text-slate-400 font-medium">{toGujarati(res.max_marks)}</td><td className="py-6 text-right font-black text-xl text-primary">{toGujarati(res.obtained_marks)}</td></tr>))}</tbody></table></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-4 py-2">
          {[{ id: 'overview', icon: LayoutDashboard, label: 'Home' }, { id: 'notifications', icon: Bell, label: 'Notif' }, { id: 'attendance', icon: CalendarIcon, label: 'Atten' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`mobile-nav-item flex-1 ${activeTab === tab.id ? 'mobile-nav-item-active' : ''}`}><tab.icon size={22} /><span className="text-[10px] uppercase font-black">{tab.label}</span></button>))}
          <button onClick={() => setIsMobileMenuOpen(true)} className="mobile-nav-item flex-1"><Menu size={22} /><span className="text-[10px] uppercase font-black">More</span></button>
        </div>
      </div>

      {/* More Menu Drawer */}
      {isMobileMenuOpen && (<div className="lg:hidden fixed inset-0 bg-slate-900/60 z-[100]" onClick={() => setIsMobileMenuOpen(false)}><div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12" onClick={e => e.stopPropagation()}><div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8" /><div className="grid grid-cols-3 gap-6">{[ { id: 'overview', icon: LayoutDashboard, label: t('overview') }, { id: 'notifications', icon: Bell, label: t('notif') }, { id: 'attendance', icon: CalendarIcon, label: 'Attendance' }, { id: 'homework', icon: BookOpen, label: 'H.W.' }, { id: 'results', icon: ClipboardCheck, label: 'Results' }, { id: 'exam-timetable', icon: CalendarIcon, label: 'Exams' } ].map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center gap-2 p-4 rounded-3xl ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-500'}`}><tab.icon size={24} /><span className="text-[10px] font-bold uppercase">{tab.label}</span></button>))}<button onClick={logout} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-red-50 text-red-500"><LogOut size={24} /><span className="text-[10px] font-bold uppercase">Logout</span></button></div></div></div>)}
    </div>
  );
};

export default ParentDashboard;
