import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api';
import { 
  User, Calendar as CalendarIcon, Clock, Bell, BookOpen, LogOut, 
  CheckCircle, XCircle, RefreshCw, Megaphone, Settings, X, ClipboardCheck, GraduationCap, Award, Languages, LayoutDashboard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Calendar from '../../components/Calendar';
import Loader from '../../components/Loader';
import EventsTimeline from '../../components/EventsTimeline';

const ParentDashboard = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(newLang);
  };

  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  const toGujarati = (num) => {
    if (i18n.language !== 'gu' || num === null || num === undefined) return num;
    return String(num).split('').map(digit => gujaratiDigits[parseInt(digit)] || digit).join('');
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [notices, setNotices] = useState([]);
  const [data, setData] = useState(null);
  const [homework, setHomework] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStudent, setViewingStudent] = useState(null);

  // Date selection for attendance and homework
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHomeworkDate, setSelectedHomeworkDate] = useState(new Date());
  const [selectedDayAttendance, setSelectedDayAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const fetchHomework = async (date) => {
    try {
      // Use local date formatting to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const res = await api.get(`/api/homework/?date=${formattedDate}`);
      setHomework(res.data);
      localStorage.setItem('parent_homework', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'homework') {
      fetchHomework(selectedHomeworkDate);
    }
  }, [activeTab, selectedHomeworkDate]);

  useEffect(() => {
    // Load from cache first
    const cachedStats = localStorage.getItem('parent_stats');
    const cachedNotices = localStorage.getItem('parent_notices');
    const cachedNotifications = localStorage.getItem('parent_notifications');
    if (cachedStats) setData(JSON.parse(cachedStats));
    if (cachedNotices) setNotices(JSON.parse(cachedNotices));
    if (cachedNotifications) setNotifications(JSON.parse(cachedNotifications));
    
    // Skip full-screen loader if cached data is present
    if (cachedStats) setLoading(false);
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'homework' && homework.length === 0) {
      const cached = localStorage.getItem('parent_homework');
      if (cached) setHomework(JSON.parse(cached));
      fetchHomework(selectedHomeworkDate);
    }
    if (activeTab === 'results' && (!data || !data.results)) {
      fetchResults();
    }
    if (activeTab === 'exam-timetable' && (!data || !data.exams)) fetchInitialData();
    if (activeTab === 'attendance' && attendanceRecords.length === 0) {
      const cached = localStorage.getItem('parent_attendance');
      if (cached) setAttendanceRecords(JSON.parse(cached));
      fetchAttendanceHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceForDate();
    }
  }, [selectedDate, activeTab]);

  const fetchAttendanceForDate = async () => {
    setRefreshing(true);
    setSelectedDayAttendance('Loading...'); // Clear old data and show loading
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const res = await api.get(`/api/attendance/?date=${dateStr}`);
      
      if (res.data.length > 0) {
        setSelectedDayAttendance(res.data[0].status);
      } else {
        setSelectedDayAttendance('Not Available');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setSelectedDayAttendance('Error');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchInitialData = async () => {
    if (!localStorage.getItem('parent_stats')) setLoading(true);
    try {
      const [statsRes, noticesRes, notifRes] = await Promise.all([
        api.get('/api/dashboard-stats/'),
        api.get('/api/notices/'),
        api.get('/api/notifications/')
      ]);
      const mergedData = { ...data, ...statsRes.data };
      setData(mergedData);
      setNotices(noticesRes.data);
      setNotifications(notifRes.data);
      localStorage.setItem('parent_stats', JSON.stringify(mergedData));
      localStorage.setItem('parent_notices', JSON.stringify(noticesRes.data));
      localStorage.setItem('parent_notifications', JSON.stringify(notifRes.data));
    } finally { setLoading(false); }
  };

  const fetchResults = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/results/');
      setData(prev => {
        const newData = { ...prev, results: res.data };
        localStorage.setItem('parent_stats', JSON.stringify(newData));
        return newData;
      });
    } finally { setRefreshing(false); }
  };

  const fetchAttendanceHistory = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/attendance/');
      setAttendanceRecords(res.data);
      localStorage.setItem('parent_attendance', JSON.stringify(res.data));
    } finally { setRefreshing(false); }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, homeworkRes, attendanceRes, noticesRes] = await Promise.all([
        api.get('/api/dashboard-stats/'),
        api.get('/api/homework/'),
        api.get('/api/attendance/'),
        api.get('/api/notices/')
      ]);

      setNotices(noticesRes.data);
      let resultsData = [];
      try {
        const resultsRes = await api.get('/api/results/');
        resultsData = resultsRes.data;
      } catch (rErr) {
        console.warn('Results data not available yet');
      }

      setData({ ...statsRes.data, results: resultsData });
      setHomework(homeworkRes.data);
      setAttendanceRecords(attendanceRes.data);
      
      const notifRes = await api.get('/api/notifications/');
      setNotifications(notifRes.data);
      
      // Update specific day if in attendance tab
      if (activeTab === 'attendance') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const record = attendanceRes.data.find(r => r.date === dateStr);
        setSelectedDayAttendance(record ? record.status : 'Not Available');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const getUpcomingEvents = () => {
    const events = [];

    // Add Exam dates
    if (data?.exams) {
      data.exams.forEach(exam => {
        if (exam.subjects) {
          exam.subjects.forEach(subject => {
            if (subject.exam_date) {
              events.push({
                type: 'exam',
                date: subject.exam_date,
                title: `${exam.name}: ${subject.subject_name}`,
                description: `${t('max_marks')}: ${toGujarati(subject.max_marks)} | ${t('time_slot')}: ${subject.start_time} - ${subject.end_time}`
              });
            }
          });
        }
      });
    }

    // Add Notices
    if (notices) {
      notices.forEach(notice => {
        events.push({
          type: 'announcement',
          date: notice.created_at,
          title: t('announcement'),
          description: notice.content
        });
      });
    }

    // Sort by date (ascending for upcoming)
    return events.sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)); // Only future/today
  };

  if (loading) return <Loader />;

  const child = data?.children?.[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <span className="text-lg md:text-xl font-bold text-primary">SchoolSync</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all text-xs md:text-sm font-bold text-slate-700"
          >
            <Languages size={16} className="text-primary" />
            <span className="hidden xs:inline">{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</span>
            <span className="xs:hidden">{i18n.language === 'en' ? 'GUJ' : 'ENG'}</span>
          </button>
          
          <div 
            onClick={() => window.location.href = '/profile'}
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-slate-50 p-1 md:p-2 rounded-xl transition-all"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold border border-slate-200">
              <User size={18} />
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar Tabs - Desktop Only */}
          <div className="hidden lg:block w-64 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <LayoutDashboard size={20} /> {t('overview')}
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={activeTab === 'notifications' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <Bell size={20} /> {t('notifications')}
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={activeTab === 'attendance' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <CalendarIcon size={20} /> {t('attendance_history')}
            </button>
            <button 
              onClick={() => setActiveTab('homework')}
              className={activeTab === 'homework' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <BookOpen size={20} /> {t('homework')}
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={activeTab === 'results' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <ClipboardCheck size={20} /> {t('exam_results')}
            </button>
            <button 
              onClick={() => setActiveTab('exam-timetable')}
              className={activeTab === 'exam-timetable' ? 'sidebar-link-active w-full' : 'sidebar-link w-full bg-white'}
            >
              <CalendarIcon size={20} /> {t('exam_timetable')}
            </button>
          </div>

          {/* Main Feed Area */}
          <div className="flex-1 space-y-6 md:space-y-8">
            {/* Announcement Banner */}
            {data?.announcement && (
              <div className="bg-primary text-white p-4 md:p-6 rounded-2xl flex items-center gap-4 md:gap-6 shadow-xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
                   <Megaphone size={100} className="md:size-[120px]" />
                </div>
                <div className="bg-white/20 p-3 md:p-4 rounded-xl backdrop-blur-md shrink-0">
                   <Megaphone size={24} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{t('administrator_announcement')}</p>
                  <p className="text-sm md:text-lg font-medium leading-tight">{data.announcement}</p>
                </div>
              </div>
            )}

            {child && (
              <div 
                onClick={() => setViewingStudent({...child, class_name: child.class_name})}
                className="bg-white border border-slate-200 p-4 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold text-xl md:text-2xl overflow-hidden border-2 md:border-4 border-slate-50 shadow-inner group-hover:ring-4 group-hover:ring-primary/10 transition-all">
                    {child.profile_picture ? (
                      <img 
                        src={getImageUrl(child.profile_picture)} 
                        alt={child.name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    ) : (
                      <User size={24} className="opacity-30" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-slate-800">{child.name}</h2>
                    <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] md:text-sm">{t('class')} {toGujarati(child.class_name)} • {t('roll_number')}: {toGujarati(child.roll_number)}</p>
                  </div>
                </div>
                <div className="hidden md:flex bg-slate-50 p-4 rounded-2xl mt-4 md:mt-0 border border-slate-100 flex-col items-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">{t('status')}</p>
                  <div className="flex items-center gap-2 text-green-500 font-bold text-xs md:text-base">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {t('enrolled')}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4 md:space-y-6">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                      <CalendarIcon className="text-primary" size={24} /> {t('school_events_timeline')}
                    </h3>
                    <EventsTimeline events={getUpcomingEvents()} />
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                      <Award className="text-primary" size={24} /> {t('upcoming_exams')}
                    </h3>
                    <div className="grid gap-4">
                      {data?.exams?.filter(ex => ex.is_visible).slice(0, 3).map(exam => (
                        <div key={exam.id} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                           <h4 className="font-bold text-slate-800 text-sm md:text-base">{exam.name}</h4>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{toGujarati(exam.subjects?.length)} {t('subjects')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-slate-800">{t('notifications')}</h2>
                  <button onClick={fetchData} disabled={refreshing} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-5 items-start">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                          <Bell size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-slate-800">
                              {notif.title === 'New Exam Timetable Added' ? t('notif_timetable_added_title', { defaultValue: notif.title }) : 
                               notif.title === 'Exam Results Published' ? t('notif_results_published_title', { defaultValue: notif.title }) :
                               notif.title === 'Exam Timetable Updated' ? t('notif_timetable_updated_title', { defaultValue: notif.title }) : 
                               notif.title}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">
                              {new Date(notif.created_at).toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US')}
                            </span>
                          </div>
                          <p className="text-slate-500 leading-relaxed font-medium">
                            {(() => {
                              if (notif.message.includes('New Exam Timetable has been added:')) {
                                const name = notif.message.split(': ')[1].split('.')[0];
                                return t('notif_timetable_added', { name });
                              }
                              if (notif.message.includes('Results for') && notif.message.includes('have been published')) {
                                const name = notif.message.split('Results for ')[1].split(' have')[0];
                                return t('notif_results_published', { name });
                              }
                              if (notif.message.includes('The exam timetable for') && notif.message.includes('has been updated')) {
                                const name = notif.message.split('The exam timetable for ')[1].split(' has')[0];
                                return t('notif_timetable_updated', { name });
                              }
                              return notif.message;
                            })()}
                          </p>
                          <p className="text-[10px] text-slate-300 mt-4 font-bold uppercase tracking-widest">
                            {new Date(notif.created_at).toLocaleTimeString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-12 rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Bell size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-400">{t('no_new_alerts')}</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-auto">
                   <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                </div>

                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="text-primary" /> {t('attendance_details')}
                    </h3>
                    <button 
                      onClick={fetchData} 
                      disabled={refreshing}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                      title="Refresh attendance records"
                    >
                      <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                    {refreshing && activeTab === 'attendance' && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center"><Loader fullPage={false} /></div>}
                    <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2">{t('selected_date')}</p>
                    <p className="text-2xl font-bold text-slate-800 mb-6">
                      {selectedDate.toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    
                    <div className={`text-4xl font-black px-10 py-5 rounded-3xl border-4 ${
                      selectedDayAttendance === 'PRESENT' 
                        ? 'bg-green-50 text-green-600 border-green-200' 
                        : selectedDayAttendance === 'ABSENT'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {selectedDayAttendance}
                    </div>
                    
                    <p className="mt-6 text-slate-400 text-sm italic">
                      {t('note_attendance_update')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'homework' && (
              <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
                {/* Calendar on Top */}
                <div className="bg-white p-4 rounded-[3rem] border border-slate-100 shadow-2xl">
                  <Calendar onDateSelect={setSelectedHomeworkDate} selectedDate={selectedHomeworkDate} />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <h3 className="text-xl font-bold text-slate-800">
                       {t('tasks_for')} {selectedHomeworkDate.toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {homework.map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{item.title}</h4>
                          <p className="text-xs font-semibold text-slate-400">{t('due_date')}: {item.due_date}</p>
                          <p className="text-slate-600 text-sm mt-3 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    {homework.length === 0 && (
                      <div className="bg-slate-50/50 border-4 border-dashed border-slate-200 rounded-[4rem] p-24 text-center">
                        <BookOpen size={60} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">{t('no_assignments_found')}</h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-slate-800">{t('academic_results')}</h2>
                  <button 
                    onClick={fetchData} 
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data?.exams?.filter(e => e.is_visible).map(exam => (
                    <div 
                      key={exam.id}
                      onClick={() => setSelectedExam(exam)}
                      className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                        selectedExam?.id === exam.id 
                          ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                          : 'bg-white border-slate-100 hover:border-primary/20 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${selectedExam?.id === exam.id ? 'bg-white/20' : 'bg-primary/5 text-primary'}`}>
                          <Award size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{exam.name}</h4>
                          <p className={`text-xs ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-slate-400'}`}>{t('click_to_view_marksheet')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedExam ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                    <div className="bg-primary p-10 text-white relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-10 -translate-y-10">
                        <GraduationCap size={200} />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <h3 className="text-4xl font-black">{selectedExam.name}</h3>
                          <p className="text-primary-foreground/70 font-medium mt-1 uppercase tracking-widest">{t('academic_performance_record')}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center">
                          <p className="text-xs font-bold uppercase tracking-tighter opacity-70">{t('grade')}</p>
                          <p className="text-3xl font-black">
                            {(() => {
                              const results = data?.results?.filter(r => r.exam_id === selectedExam.id) || [];
                              const totalObtained = results.reduce((acc, r) => acc + r.obtained_marks, 0);
                              const totalMax = results.reduce((acc, r) => acc + r.max_marks, 0);
                              const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                              
                              if (percentage >= 90) return 'A+';
                              if (percentage >= 80) return 'A';
                              if (percentage >= 70) return 'B';
                              if (percentage >= 60) return 'C';
                              return 'D';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-10">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b-2 border-slate-100">
                            <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('subject')}</th>
                            <th className="pb-6 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('max_marks')}</th>
                            <th className="pb-6 text-right text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('marks_obtained')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(data?.results?.filter(r => r.exam_id === selectedExam.id) || []).map(res => (
                            <tr key={res.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-6 font-bold text-slate-700 text-lg">{res.subject_name}</td>
                              <td className="py-6 text-center font-medium text-slate-400">{toGujarati(res.max_marks)}</td>
                              <td className="py-6 text-right">
                                <span className={`text-xl font-black ${res.obtained_marks >= (res.max_marks * 0.4) ? 'text-primary' : 'text-red-500'}`}>
                                  {toGujarati(res.obtained_marks)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-10 pt-10 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-10">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('total_marks')}</p>
                            <p className="text-2xl font-black text-slate-800">
                              {toGujarati((data?.results?.filter(r => r.exam_id === selectedExam.id) || []).reduce((acc, r) => acc + r.obtained_marks, 0))}
                              <span className="text-slate-300 font-medium"> / {toGujarati((data?.results?.filter(r => r.exam_id === selectedExam.id) || []).reduce((acc, r) => acc + r.max_marks, 0))}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('percentage')}</p>
                            <p className="text-2xl font-black text-primary">
                              {(() => {
                                const results = data?.results?.filter(r => r.exam_id === selectedExam.id) || [];
                                const totalObtained = results.reduce((acc, r) => acc + r.obtained_marks, 0);
                                const totalMax = results.reduce((acc, r) => acc + r.max_marks, 0);
                                return toGujarati(totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0);
                              })()}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="text-green-700 font-bold">{t('result_verified')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                    <ClipboardCheck size={64} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-2xl font-black text-slate-400">{t('select_exam_category')}</h3>
                    <p className="text-slate-400 mt-2 font-medium">{t('view_academic_record_desc')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exam-timetable' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-slate-800">{t('exam_timetable')}</h2>
                  <button onClick={() => fetchData()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data?.exams?.map(exam => (
                    <div 
                      key={exam.id}
                      onClick={() => setSelectedExam(exam)}
                      className={`group p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative ${
                        selectedExam?.id === exam.id 
                          ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-primary/20 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${selectedExam?.id === exam.id ? 'bg-white/20' : 'bg-primary/5 text-primary'}`}>
                          <CalendarIcon size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{exam.name}</h4>
                          <p className={`text-xs mt-1 ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-slate-400'}`}>{t('click_to_view_schedule')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedExam ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                    <div className="bg-primary p-10 text-white relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-10 -translate-y-10">
                        <CalendarIcon size={200} />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <h3 className="text-4xl font-black">{t('exam_timetable_title', { name: selectedExam.name })}</h3>
                          <p className="text-primary-foreground/70 font-medium mt-1 uppercase tracking-widest">{t('official_examination_schedule')}</p>
                        </div>
                        <button onClick={() => setSelectedExam(null)} className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">{t('switch_exam')}</button>
                      </div>
                    </div>

                    <div className="p-10 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-100">
                            <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('subject')}</th>
                            <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('date')}</th>
                            <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('time_slot')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedExam.subjects.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-6">
                                <span className="font-bold text-slate-700 text-lg block">{sub.subject_name}</span>
                                <span className="text-[10px] font-black text-slate-300 uppercase">{t('official_subject_portal')}</span>
                              </td>
                              <td className="py-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-600">
                                    {sub.exam_date ? new Date(sub.exam_date).toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : t('tba')}
                                  </span>
                                  <span className="text-xs text-slate-400 uppercase font-bold">
                                    {sub.exam_date ? new Date(sub.exam_date).toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { weekday: 'long' }) : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="py-6">
                                {sub.start_time ? (
                                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl w-fit">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="font-black text-slate-700 text-sm">
                                      {toGujarati(sub.start_time.substring(0, 5))} - {toGujarati(sub.end_time.substring(0, 5))}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic">{t('not_scheduled')}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-4 border-dashed border-slate-200 rounded-[4rem] p-32 text-center">
                    <CalendarIcon size={80} className="mx-auto text-slate-200 mb-6 animate-pulse" />
                    <h3 className="text-3xl font-black text-slate-400">{t('select_exam_category')}</h3>
                    <p className="text-slate-400 mt-2 font-medium max-w-sm mx-auto text-lg">{t('click_to_view_schedule')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Student Modal (Parent View) */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="relative h-48 bg-primary">
              <button 
                onClick={() => setViewingStudent(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg">
                {viewingStudent.profile_picture ? (
                  <img src={getImageUrl(viewingStudent.profile_picture)} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-6 text-slate-300" />
                )}
              </div>
            </div>
            <div className="pt-20 pb-10 px-8 text-center">
              <h2 className="text-3xl font-bold text-slate-800">{viewingStudent.name}</h2>
              <p className="text-primary font-bold tracking-widest uppercase text-sm mt-1">{t('academic_profile')}</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('roll_number')}</p>
                  <p className="font-bold text-slate-700 text-lg">{toGujarati(viewingStudent.roll_number)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('class')}</p>
                  <p className="font-bold text-slate-700 text-lg">{toGujarati(viewingStudent.class_name)}</p>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setViewingStudent(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  {t('back_to_dashboard')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom duration-400 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <div className="grid grid-cols-3 gap-6">
              <button 
                onClick={() => { setActiveTab('homework'); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${activeTab === 'homework' ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-500'}`}
              >
                <BookOpen size={24} />
                <span className="text-[10px] font-bold uppercase">{t('homework')}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('results'); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${activeTab === 'results' ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-500'}`}
              >
                <ClipboardCheck size={24} />
                <span className="text-[10px] font-bold uppercase">{t('results')}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('exam-timetable'); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${activeTab === 'exam-timetable' ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-500'}`}
              >
                <CalendarIcon size={24} />
                <span className="text-[10px] font-bold uppercase">{t('exam')}</span>
              </button>
              <button 
                onClick={logout}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-red-50 text-red-500"
              >
                <LogOut size={24} />
                <span className="text-[10px] font-bold uppercase">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 pb-safe">
        <div className="flex justify-around items-center px-2 py-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`mobile-nav-item flex-1 ${activeTab === 'overview' ? 'mobile-nav-item-active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('overview')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`mobile-nav-item flex-1 ${activeTab === 'notifications' ? 'mobile-nav-item-active' : ''}`}
          >
            <div className="relative">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </div>
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('notif')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('attendance')}
            className={`mobile-nav-item flex-1 ${activeTab === 'attendance' ? 'mobile-nav-item-active' : ''}`}
          >
            <CalendarIcon size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('attendance')}</span>
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`mobile-nav-item flex-1 ${isMobileMenuOpen ? 'mobile-nav-item-active' : ''}`}
          >
            <Settings size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('more')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
