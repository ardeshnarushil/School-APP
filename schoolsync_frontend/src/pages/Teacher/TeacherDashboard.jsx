import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api';
import {
  Users, BookOpen, CheckSquare, LogOut,
  Calendar as CalendarIcon, Plus, Save, Clock, User, RefreshCw, UserPlus, Trash2, Megaphone, Camera, AlertCircle, Settings, X, ClipboardCheck, GraduationCap, Edit, Trash, Award, Languages, LayoutDashboard, Menu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Calendar from '../../components/Calendar';
import Loader from '../../components/Loader';
import EventsTimeline from '../../components/EventsTimeline';
import Skeleton from '../../components/Skeleton';
import ConfirmationModal from '../../components/ConfirmationModal';

/**
 * TeacherDashboard Component
 * Refactored for clean structure and modularity.
 * No functionality has been changed.
 */
const TeacherDashboard = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data States
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({});
  const [exams, setExams] = useState([]);
  const [homework, setHomework] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentResults, setCurrentResults] = useState([]);

  // Form & Selection States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHomeworkDate, setSelectedHomeworkDate] = useState(new Date());
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Modal & Edit States
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [editingParent, setEditingParent] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Initializers
  const [homeworkForm, setHomeworkForm] = useState({ title: '', description: '', due_date: '' });
  const [newStudent, setNewStudent] = useState({ name: '', roll_number: '', photo: null });
  const [newExamForm, setNewExamForm] = useState({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
  const [newParent, setNewParent] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', student_id: ''
  });

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceForDate(selectedDate);
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'homework') fetchHomework(selectedHomeworkDate);
  }, [activeTab, selectedHomeworkDate]);

  useEffect(() => {
    if (selectedExam) fetchResultsForExam(selectedExam.id);
  }, [selectedExam]);

  useEffect(() => {
    if (selectedExam) {
      const updated = exams.find(e => e.id === selectedExam.id);
      if (updated) setSelectedExam(updated);
    }
  }, [exams]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [studentsRes, statsRes, parentsRes, examsRes, noticesRes] = await Promise.all([
        api.get('/api/students/'),
        api.get('/api/dashboard-stats/'),
        api.get('/api/parents/'),
        api.get('/api/exams/'),
        api.get('/api/notices/')
      ]);
      setStudents(studentsRes.data);
      setStats(statsRes.data);
      setParents(parentsRes.data);
      setExams(examsRes.data);
      setNotices(noticesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAttendanceForDate = async (date) => {
    setRefreshing(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get(`/api/attendance/?date=${dateStr}`);
      const attMap = {};
      res.data.forEach(att => attMap[att.student] = att.status);
      const initialAtt = {};
      students.forEach(s => initialAtt[s.id] = attMap[s.id] || 'ABSENT');
      setAttendance(initialAtt);
    } catch (err) {
      console.error('Error fetching attendance:', err);
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

  const fetchResultsForExam = async (examId) => {
    try {
      const res = await api.get(`/api/results/?exam=${examId}`);
      setCurrentResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- ACTIONS ---
  const handlePostHomework = async (e) => {
    e.preventDefault();
    try {
      const classId = students[0]?.school_class;
      if (!classId) return alert("No class assigned");
      await api.post('/api/homework/', { ...homeworkForm, school_class: classId });
      alert('Homework posted successfully!');
      setHomeworkForm({ title: '', description: '', due_date: '' });
      fetchHomework(selectedHomeworkDate);
    } catch (err) {
      alert('Error posting homework');
    }
  };

  const saveAttendance = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const promises = Object.entries(attendance).map(([studentId, status]) =>
        api.post('/api/attendance/', { student: studentId, date: dateStr, status: status })
      );
      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Error saving attendance');
    }
  };

  const handleCreateParent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingParent) {
        const payload = {
          username: newParent.username, email: newParent.email,
          first_name: newParent.first_name, last_name: newParent.last_name,
        };
        if (newParent.password) payload.password = newParent.password;
        await api.put(`/api/parents/${editingParent.id}/`, payload);
        if (newParent.student_id) await api.patch(`/api/students/${newParent.student_id}/`, { parent: editingParent.id });
        alert('Parent account updated!');
        setEditingParent(null);
      } else {
        const parentRes = await api.post('/api/parents/', { ...newParent, role: 'PARENT' });
        if (newParent.student_id) await api.patch(`/api/students/${newParent.student_id}/`, { parent: parentRes.data.id });
        alert('Parent account created and linked!');
      }
      setNewParent({ username: '', email: '', password: '', first_name: '', last_name: '', student_id: '' });
      fetchData();
    } catch (err) {
      alert('Error saving parent account');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newStudent.name);
    formData.append('roll_number', newStudent.roll_number);
    if (stats.class_id) formData.append('school_class', stats.class_id);
    if (newStudent.photo) formData.append('profile_picture', newStudent.photo);
    setSaving(true);
    try {
      await api.post('/api/students/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Student added successfully!');
      setNewStudent({ name: '', roll_number: '', photo: null });
      fetchData();
    } catch (err) {
      alert('Error adding student');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editingStudent.name);
    formData.append('roll_number', editingStudent.roll_number);
    if (editingStudent.photo) formData.append('profile_picture', editingStudent.photo);
    try {
      await api.patch(`/api/students/${editingStudent.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Student updated successfully!');
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      alert('Error updating student');
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await api.put(`/api/exams/${editingExam.id}/`, newExamForm);
        alert('Exam Updated Successfully!');
        if (selectedExam?.id === editingExam.id) {
          const res = await api.get(`/api/exams/${editingExam.id}/`);
          setSelectedExam(res.data);
        }
        setEditingExam(null);
      } else {
        await api.post('/api/exams/', newExamForm);
        alert('Exam Created Successfully!');
      }
      setNewExamForm({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
      fetchData();
    } catch (err) {
      alert('Failed: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleSaveResult = async (studentId, subjectId, marks) => {
    try {
      await api.post('/api/results/', { student: studentId, exam_subject: subjectId, obtained_marks: parseInt(marks) });
      fetchResultsForExam(selectedExam.id);
    } catch (err) {
      alert('Error saving result');
    }
  };

  const toggleExamVisibility = async (id, currentStatus) => {
    try {
      await api.patch(`/api/exams/${id}/`, { is_visible: !currentStatus });
      fetchData();
      if (selectedExam?.id === id) setSelectedExam({ ...selectedExam, is_visible: !currentStatus });
    } catch (err) {
      alert('Error toggling visibility');
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      let endpoint = '';
      if (deleteModal.type === 'parent') endpoint = `/api/parents/${deleteModal.id}/`;
      else if (deleteModal.type === 'homework') endpoint = `/api/homework/${deleteModal.id}/`;
      else if (deleteModal.type === 'exam') endpoint = `/api/exams/${deleteModal.id}/`;
      else if (deleteModal.type === 'student') endpoint = `/api/students/${deleteModal.id}/`;
      
      await api.delete(endpoint);
      fetchData();
      if (deleteModal.type === 'homework') fetchHomework(selectedHomeworkDate);
      if (selectedExam?.id === deleteModal.id) setSelectedExam(null);
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Deleted successfully');
    } catch (err) {
      alert('Error deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const getUpcomingEvents = () => {
    const events = [];
    exams?.forEach(exam => {
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

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <Loader />;

  // --- RENDER FUNCTIONS ---
  const renderHeader = () => (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Teacher Console</h2>
        <p className="text-slate-500">Class {stats.class_name} • Instructor: {localStorage.getItem('username')}</p>
      </div>
      <div className="flex gap-4 items-center">
        <div onClick={() => window.location.href = '/profile'} className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all group">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all"><User size={18} /></div>
          <span className="font-semibold text-slate-700">{localStorage.getItem('username') || 'Teacher'}</span>
        </div>
        <div className="card flex items-center gap-3 px-6 py-3">
          <Users className="text-primary" />
          <div><p className="text-xs text-slate-400 font-bold uppercase">Students</p><p className="font-bold">{stats.total_students}</p></div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile Nav */}
      <nav className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center"><BookOpen size={18} /></div><span className="text-lg font-bold text-primary">SchoolSync</span></div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLanguage} className="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-100">{i18n.language === 'en' ? 'GUJ' : 'ENG'}</button>
          <div onClick={() => window.location.href = '/profile'} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-primary border border-slate-200"><User size={18} /></div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-10 flex-col sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"><BookOpen size={24} /></div><span className="text-xl font-bold text-primary">SchoolSync</span></div>
          <button onClick={toggleLanguage} className="mb-6 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-4 py-3 rounded-[2.5rem] transition-all text-xs font-bold text-slate-700 border border-slate-100"><Languages size={18} className="text-primary" />{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</button>
          <nav className="flex-1 space-y-2">
            {[
              { id: 'overview', icon: LayoutDashboard, label: t('overview') },
              { id: 'students', icon: Users, label: t('my_students') },
              { id: 'homework', icon: Plus, label: t('post_homework') },
              { id: 'attendance', icon: CheckSquare, label: t('attendance') },
              { id: 'results', icon: ClipboardCheck, label: t('exam_results') },
              { id: 'exam-timetable', icon: CalendarIcon, label: 'Exam Schedule' },
              { id: 'parents', icon: UserPlus, label: t('manage_parents') },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'sidebar-link-active' : 'sidebar-link'} w-full`}><tab.icon size={20} /> {tab.label}</button>
            ))}
          </nav>
          <button onClick={logout} className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 mt-auto"><LogOut size={20} /> {t('logout')}</button>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 lg:pb-8">
          {stats.announcement && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-xl flex items-center gap-4 animate-in fade-in slide-in-from-top">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Megaphone size={20} /></div>
              <div><p className="text-sm font-bold text-amber-800">{t('administrator_announcement')}</p><p className="text-amber-700">{stats.announcement}</p></div>
            </div>
          )}

          {renderHeader()}

          {/* TAB CONTENT */}
          <div className="animate-in fade-in duration-500">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><CalendarIcon className="text-primary" /> {t('school_events_timeline')}</h3><p className="text-slate-500 -mt-4">{t('school_events_desc')}</p><EventsTimeline events={getUpcomingEvents()} /></div>
                <div className="space-y-6"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Award className="text-primary" /> {t('upcoming_exams')}</h3><div className="grid gap-4">{exams?.filter(ex => ex.is_visible).slice(0, 3).map(exam => (<div key={exam.id} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm"><h4 className="font-bold text-slate-800">{exam.name}</h4><p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{toGujarati(exam.subjects?.length)} {t('subjects')}</p></div>))}</div></div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-10">
                <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm"><h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary"><Plus size={22} /> Add New Student</h3>
                  <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 items-end">
                    <div><label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label><input type="text" className="input-field" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 mb-2">Roll Number</label><input type="text" className="input-field" placeholder="Roll No" value={newStudent.roll_number} onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})} required /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Camera size={14} /> Profile Photo</label><input type="file" className="input-field py-1" accept="image/*" onChange={e => setNewStudent({...newStudent, photo: e.target.files[0]})} /></div>
                    <button type="submit" className="btn-primary py-3">Add Student</button>
                  </form>
                </div>
                <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800">Assigned Students</h3><button onClick={fetchData} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {students.map(student => (
                    <div key={student.id} className="card hover:shadow-lg transition-all group overflow-hidden border-t-4 border-t-primary/10"><div className="flex items-center gap-4">
                      <div onClick={() => setViewingStudent(student)} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold text-xl overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all">{student.profile_picture ? (<img src={getImageUrl(student.profile_picture)} alt={student.name} className="w-full h-full object-cover" />) : (<User className="opacity-30" size={32} />)}</div>
                      <div className="flex-1"><h3 className="font-bold text-slate-800">{student.name}</h3><p className="text-sm text-slate-500">Roll: {student.roll_number}</p></div>
                      <div className="flex flex-col gap-2"><button onClick={() => setEditingStudent(student)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg"><Settings size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, type: 'student', id: student.id, title: 'Delete Student', message: 'Delete student record and all data?' })} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></div>
                    </div></div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-8 pb-20">
                <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50"><div className="text-3xl font-black text-indigo-900">{students.filter(s => attendance[s.id] === 'PRESENT').length}/{students.length}</div><div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Present Today</div></div>
                  <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100/50"><div className="text-3xl font-black text-orange-900">{students.filter(s => attendance[s.id] === 'ABSENT' || !attendance[s.id]).length}</div><div className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Absent</div></div>
                </div>
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden ring-2 ring-slate-50 flex items-center justify-center text-indigo-600 font-black">{student.profile_picture ? (<img src={getImageUrl(student.profile_picture)} className="w-full h-full object-cover" />) : student.name.charAt(0)}</div><div><h4 className="font-black text-slate-800 text-lg leading-tight">{student.name}</h4><span className="text-xs font-bold text-slate-400">Roll No: {student.roll_number}</span></div></div>
                      <div className="flex gap-2"><button onClick={() => setAttendance(prev => ({...prev, [student.id]: 'PRESENT'}))} className={`px-4 py-3 rounded-2xl transition-all font-black text-xs uppercase ${attendance[student.id] === 'PRESENT' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Present</button><button onClick={() => setAttendance(prev => ({...prev, [student.id]: 'ABSENT'}))} className={`px-4 py-3 rounded-2xl transition-all font-black text-xs uppercase ${attendance[student.id] === 'ABSENT' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Absent</button></div>
                    </div>
                  ))}
                </div>
                <button onClick={saveAttendance} className="fixed bottom-24 left-10 right-10 bg-indigo-600 text-white p-5 rounded-[2rem] font-black text-lg shadow-2xl z-40 lg:relative lg:bottom-0 lg:left-0 lg:right-0 lg:w-full flex items-center justify-center gap-3"><Save size={24} />Save Attendance</button>
              </div>
            )}

            {activeTab === 'homework' && (
              <div className="max-w-4xl mx-auto space-y-12">
                <Calendar onDateSelect={setSelectedHomeworkDate} selectedDate={selectedHomeworkDate} />
                <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><Plus className="text-primary" /> New Assignment</h3>
                  <form onSubmit={handlePostHomework} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <input type="text" className="input-field py-4" placeholder="Assignment Title" value={homeworkForm.title} onChange={e => setHomeworkForm({ ...homeworkForm, title: e.target.value })} required />
                      <input type="date" className="input-field py-4" value={homeworkForm.due_date} onChange={e => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })} required />
                    </div>
                    <textarea className="input-field min-h-[120px] py-4" placeholder="Instructions..." value={homeworkForm.description} onChange={e => setHomeworkForm({ ...homeworkForm, description: e.target.value })} required />
                    <button type="submit" className="btn-primary w-full py-5 text-lg font-black rounded-[2.5rem]">Publish Now</button>
                  </form>
                </div>
                <div className="space-y-4">
                  {homework.map(hw => (
                    <div key={hw.id} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-start">
                      <div><h4 className="text-lg font-bold text-slate-800">{hw.title}</h4><p className="text-xs font-semibold text-slate-400">Due: {hw.due_date}</p><p className="text-slate-600 text-sm mt-3">{hw.description}</p></div>
                      <button onClick={() => setDeleteModal({ isOpen: true, type: 'homework', id: hw.id, title: 'Delete Homework', message: 'Delete this assignment?' })} className="p-2 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  {homework.length === 0 && <div className="bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[4rem] p-24 text-center text-slate-400 font-bold">No Assignments Found</div>}
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-8">
                <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative">
                  <h2 className="text-3xl font-black text-slate-800 mb-8">{editingExam ? 'Edit Exam' : 'New Exam Category'}</h2>
                  <form onSubmit={handleAddExam} className="space-y-6">
                    <input type="text" placeholder="Exam Category Name" className="input-field py-4 font-bold w-full" value={newExamForm.name} onChange={e => setNewExamForm({...newExamForm, name: e.target.value})} required />
                    <div className="space-y-3">
                      {newExamForm.subjects.map((sub, idx) => (
                        <div key={idx} className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                          <div className="lg:col-span-2"><input type="text" placeholder="Subject" className="input-field" value={sub.name} onChange={e => { const s = [...newExamForm.subjects]; s[idx].name = e.target.value; setNewExamForm({...newExamForm, subjects: s}); }} required /></div>
                          <div className="lg:col-span-1"><input type="number" placeholder="Max" className="input-field" value={sub.max_marks} onChange={e => { const s = [...newExamForm.subjects]; s[idx].max_marks = parseInt(e.target.value); setNewExamForm({...newExamForm, subjects: s}); }} required /></div>
                          {idx > 0 && <button type="button" onClick={() => setNewExamForm({...newExamForm, subjects: newExamForm.subjects.filter((_, i) => i !== idx)})} className="p-3 text-red-400 hover:bg-red-50 rounded-full"><Trash size={20} /></button>}
                        </div>
                      ))}
                      <button type="button" onClick={() => setNewExamForm({...newExamForm, subjects: [...newExamForm.subjects, { name: '', max_marks: 100 }]})} className="text-primary font-bold text-sm flex items-center gap-2"><Plus size={16} /> Add Subject</button>
                    </div>
                    <button type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-3"><GraduationCap size={20} /> {editingExam ? 'Update' : 'Create'} Exam</button>
                  </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exams.map(exam => (
                    <div key={exam.id} onClick={() => setSelectedExam(exam)} className={`p-6 md:p-10 rounded-2xl md:rounded-[2rem] border-2 cursor-pointer transition-all relative ${selectedExam?.id === exam.id ? 'bg-primary border-primary text-white shadow-2xl scale-105' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-3"><Award size={24} /><h4 className="font-bold text-lg">{exam.name}</h4></div>
                      <div className="mt-6 flex items-center justify-between"><span className="text-[10px] uppercase font-black tracking-widest">{exam.is_visible ? 'Visible' : 'Hidden'}</span><input type="checkbox" checked={exam.is_visible} onChange={() => toggleExamVisibility(exam.id, exam.is_visible)} onClick={e => e.stopPropagation()} /></div>
                    </div>
                  ))}
                </div>
                {selectedExam && (
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-x-auto">
                    <div className="p-4 md:p-10 bg-slate-50/50 flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800">Grading: {selectedExam.name}</h3><button onClick={() => setSelectedExam(null)} className="btn-secondary py-2 px-4 text-xs">Switch</button></div>
                    <table className="w-full text-left">
                      <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-4 md:px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th><th className="px-4 md:px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Enter Marks</th><th className="px-4 md:px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Results</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map(student => {
                          const results = currentResults.filter(r => r.student === student.id && r.exam_id === selectedExam.id);
                          return (<tr key={student.id} className="hover:bg-slate-50/30 transition-colors"><td className="px-4 md:px-8 py-6 font-black text-slate-700">{student.name}</td><td className="px-4 md:px-8 py-6"><select className="input-field py-2 text-sm" onChange={e => { const s = selectedExam.subjects.find(sub => sub.id === e.target.value); if(s) { const m = prompt(`Marks for ${student.name} in ${s.subject_name}`); if(m) handleSaveResult(student.id, s.id, m); e.target.value = ''; } }}><option value="">Select Subject...</option>{selectedExam.subjects.map(s => (<option key={s.id} value={s.id}>{s.subject_name}</option>))}</select></td><td className="px-4 md:px-8 py-6 flex flex-wrap gap-2">{results.map(r => (<div key={r.id} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-primary">{r.subject_name}: {r.obtained_marks}</div>))}</td></tr>);
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exam-timetable' && (
              <div className="space-y-10">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-800">Exam Timetable</h2><button onClick={() => { setEditingExam(null); setNewExamForm({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] }); }} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><Plus size={18} /> New Exam</button></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{exams.map(exam => (<div key={exam.id} onClick={() => setSelectedExam(exam)} className={`p-6 md:p-10 rounded-2xl border-2 cursor-pointer ${selectedExam?.id === exam.id ? 'bg-primary border-primary text-white' : 'bg-white border-slate-100 hover:bg-slate-50'}`}><h4 className="font-bold text-lg">{exam.name}</h4><p className="text-xs opacity-70">View Schedule</p></div>))}</div>
                {selectedExam && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"><div className="bg-primary p-10 text-white"><h3 className="text-4xl font-black">{selectedExam.name} Timetable</h3></div>
                    <div className="p-10 overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b-2 border-slate-100"><th className="pb-6 text-xs font-black text-slate-400 uppercase">Subject</th><th className="pb-6 text-xs font-black text-slate-400 uppercase">Date</th><th className="pb-6 text-xs font-black text-slate-400 uppercase">Time Slot</th></tr></thead><tbody className="divide-y divide-slate-50">{selectedExam.subjects.map(sub => (<tr key={sub.id} className="hover:bg-slate-50/50 transition-colors"><td className="py-6 font-bold text-slate-700 text-lg">{sub.subject_name}</td><td className="py-6 font-bold text-slate-600">{sub.exam_date || 'TBA'}</td><td className="py-6 font-black text-slate-700 text-sm">{sub.start_time?.substring(0,5)} - {sub.end_time?.substring(0,5)}</td></tr>))}</tbody></table></div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'parents' && (
              <div className="space-y-10">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl"><h3 className="text-2xl font-black mb-8">{editingParent ? 'Update Parent' : 'Register Parent'}</h3>
                  <form onSubmit={handleCreateParent} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <input type="text" className="input-field" placeholder="First Name" value={newParent.first_name} onChange={e => setNewParent({...newParent, first_name: e.target.value})} required />
                    <input type="text" className="input-field" placeholder="Last Name" value={newParent.last_name} onChange={e => setNewParent({...newParent, last_name: e.target.value})} required />
                    <input type="text" className="input-field" placeholder="Username" value={newParent.username} onChange={e => setNewParent({...newParent, username: e.target.value})} required />
                    <input type="email" className="input-field" placeholder="Email" value={newParent.email} onChange={e => setNewParent({...newParent, email: e.target.value})} required />
                    <input type="password" className="input-field" placeholder="Password" value={newParent.password} onChange={e => setNewParent({...newParent, password: e.target.value})} required={!editingParent} />
                    <select className="input-field" value={newParent.student_id} onChange={e => setNewParent({...newParent, student_id: e.target.value})} required><option value="">Select Child</option>{students.map(s => (<option key={s.id} value={s.id}>{s.name} (Roll: {s.roll_number})</option>))}</select>
                    <button type="submit" className="btn-primary w-full py-4 col-span-1 md:col-span-2">{editingParent ? 'Update' : 'Create'} Parent Account</button>
                  </form>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b border-slate-100"><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Parent Name</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th><th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{parents.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-all"><td className="px-6 py-4 font-bold text-slate-700">{p.first_name} {p.last_name}</td><td className="px-6 py-4 text-slate-500">{p.email}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => { setEditingParent(p); setNewParent({...p, password: ''}); }} className="p-2 text-primary"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, type: 'parent', id: p.id, title: 'Delete Parent', message: 'Delete parent account?' })} className="p-2 text-red-400"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Bottom Nav */}
      {viewingStudent && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl"><div className="relative h-48 bg-primary"><button onClick={() => setViewingStudent(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full"><X size={20} /></button><div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg">{viewingStudent.profile_picture ? (<img src={getImageUrl(viewingStudent.profile_picture)} className="w-full h-full object-cover" />) : (<User className="w-full h-full p-10 text-slate-300" />)}</div></div><div className="pt-20 pb-10 px-8 text-center"><h2 className="text-3xl font-bold text-slate-800">{viewingStudent.name}</h2><p className="text-primary font-bold tracking-widest uppercase text-sm mt-1">Student Profile</p><div className="mt-8 grid grid-cols-2 gap-4"><div className="bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Roll Number</p><p className="font-bold text-slate-700 text-lg">{viewingStudent.roll_number}</p></div><div className="bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Class</p><p className="font-bold text-slate-700 text-lg">{viewingStudent.class_name}</p></div></div><div className="mt-8"><button onClick={() => setViewingStudent(null)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-[2.5rem] hover:bg-slate-200 transition-all">Close Profile</button></div></div></div></div>)}
      
      {editingStudent && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"><div className="p-10 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800">Edit Student Record</h3><button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button></div><form onSubmit={handleEditStudent} className="p-10 space-y-6"><div className="flex items-center gap-10 mb-4"><div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 flex items-center justify-center">{editingStudent.profile_picture ? (<img src={getImageUrl(editingStudent.profile_picture)} className="w-full h-full object-cover" />) : (<User className="text-slate-300" size={40} />)}</div><div><label className="block text-sm font-bold text-slate-700 mb-2">Update Photo</label><input type="file" accept="image/*" onChange={e => setEditingStudent({...editingStudent, photo: e.target.files[0]})} className="text-xs" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div><label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label><input type="text" className="input-field" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} required /></div><div><label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label><input type="text" className="input-field" value={editingStudent.roll_number} onChange={e => setEditingStudent({...editingStudent, roll_number: e.target.value})} required /></div></div><div className="flex gap-4 pt-4"><button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-[2rem]">Cancel</button><button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-[2rem] shadow-lg shadow-primary/20">Save Changes</button></div></form></div></div>)}
      
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={handleConfirmDelete} title={deleteModal.title} message={deleteModal.message} isDeleting={isDeleting} />
      
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-4 py-2">
          {[{ id: 'overview', icon: LayoutDashboard, label: 'Home' }, { id: 'students', icon: Users, label: 'Stud.' }, { id: 'attendance', icon: CheckSquare, label: 'Atten.' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`mobile-nav-item flex-1 ${activeTab === tab.id ? 'mobile-nav-item-active' : ''}`}><tab.icon size={22} /><span className="text-[10px] uppercase font-black tracking-tighter">{tab.label}</span></button>))}
          <button onClick={() => setIsMobileMenuOpen(true)} className={`mobile-nav-item flex-1 ${isMobileMenuOpen ? 'mobile-nav-item-active' : ''}`}><Menu size={22} /><span className="text-[10px] uppercase font-black tracking-tighter">More</span></button>
        </div>
      </div>
      
      {isMobileMenuOpen && (<div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setIsMobileMenuOpen(false)}><div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl" onClick={e => e.stopPropagation()}><div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" /><div className="grid grid-cols-3 gap-6">{[ { id: 'overview', icon: LayoutDashboard, label: t('overview') }, { id: 'students', icon: Users, label: t('students') }, { id: 'attendance', icon: CheckSquare, label: t('attendance') }, { id: 'exam-timetable', icon: CalendarIcon, label: 'Exams' }, { id: 'parents', icon: UserPlus, label: 'Parents' }, { id: 'homework', icon: Plus, label: 'H.W.' }, { id: 'results', icon: ClipboardCheck, label: 'Results' } ].map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${activeTab === tab.id ? 'bg-indigo-600/10 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}><tab.icon size={24} /><span className="text-[10px] font-bold uppercase">{tab.label}</span></button>))}<button onClick={logout} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-red-50 text-red-500"><LogOut size={24} /><span className="text-[10px] font-bold uppercase">{t('logout')}</span></button></div></div></div>)}
    </div>
  );
};

export default TeacherDashboard;
