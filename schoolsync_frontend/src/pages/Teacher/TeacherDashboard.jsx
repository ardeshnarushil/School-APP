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

const TeacherDashboard = () => {
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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({});
  const [homeworkForm, setHomeworkForm] = useState({ title: '', description: '', due_date: '' });
  const [newStudent, setNewStudent] = useState({ name: '', roll_number: '', photo: null });
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [newExamForm, setNewExamForm] = useState({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
  const [editingParent, setEditingParent] = useState(null);
  const [newParent, setNewParent] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    student_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  // Attendance and Homework states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHomeworkDate, setSelectedHomeworkDate] = useState(new Date());
  const [homework, setHomework] = useState([]);
  const [attendance, setAttendance] = useState({});


  useEffect(() => {
    // Load from cache first
    const cachedStats = localStorage.getItem('teacher_stats');
    const cachedNotices = localStorage.getItem('teacher_notices');
    if (cachedStats) setStats(JSON.parse(cachedStats));
    if (cachedNotices) setNotices(JSON.parse(cachedNotices));
    
    // If we have cached data, we can skip the initial full-screen loader
    if (cachedStats) setLoading(false);
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'students' && students.length === 0) {
      const cached = localStorage.getItem('teacher_students');
      if (cached) setStudents(JSON.parse(cached));
      fetchStudents();
    }
    if (activeTab === 'parents' && parents.length === 0) {
      const cached = localStorage.getItem('teacher_parents');
      if (cached) setParents(JSON.parse(cached));
      fetchParents();
    }
    if (activeTab === 'exam-timetable' && exams.length === 0) {
      const cached = localStorage.getItem('teacher_exams');
      if (cached) setExams(JSON.parse(cached));
      fetchExams();
    }
    if (activeTab === 'results' && exams.length === 0) fetchExams();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      const updated = exams.find(e => e.id === selectedExam.id);
      if (updated) setSelectedExam(updated);
    }
  }, [exams]);

  const fetchInitialData = async () => {
    // Only show loader if we don't have cached data
    if (!localStorage.getItem('teacher_stats')) setLoading(true);
    try {
      const [statsRes, noticesRes] = await Promise.all([
        api.get('/api/dashboard-stats/'),
        api.get('/api/notices/')
      ]);
      setStats(statsRes.data);
      setNotices(noticesRes.data);
      localStorage.setItem('teacher_stats', JSON.stringify(statsRes.data));
      localStorage.setItem('teacher_notices', JSON.stringify(noticesRes.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/students/');
      setStudents(res.data);
      localStorage.setItem('teacher_students', JSON.stringify(res.data));
    } finally { setRefreshing(false); }
  };

  const fetchParents = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/parents/');
      setParents(res.data);
      localStorage.setItem('teacher_parents', JSON.stringify(res.data));
    } finally { setRefreshing(false); }
  };

  const fetchExams = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/exams/');
      setExams(res.data);
      localStorage.setItem('teacher_exams', JSON.stringify(res.data));
    } finally { setRefreshing(false); }
  };

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

  const handleCreateParent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingParent) {
        // 1. Update Parent User
        const payload = {
          username: newParent.username,
          email: newParent.email,
          first_name: newParent.first_name,
          last_name: newParent.last_name,
        };
        if (newParent.password) payload.password = newParent.password;
        
        await api.put(`/api/parents/${editingParent.id}/`, payload);
        
        // 2. Link/Relink Student
        if (newParent.student_id) {
          await api.patch(`/api/students/${newParent.student_id}/`, {
            parent: editingParent.id
          });
        }
        
        alert('Parent account updated!');
        setEditingParent(null);
      } else {
        // 1. Create Parent User
        const parentRes = await api.post('/api/parents/', {
          username: newParent.username,
          email: newParent.email,
          password: newParent.password,
          first_name: newParent.first_name,
          last_name: newParent.last_name,
          role: 'PARENT'
        });

        // 2. Link Student to this Parent
        if (newParent.student_id) {
          await api.patch(`/api/students/${newParent.student_id}/`, {
            parent: parentRes.data.id
          });
        }
        alert('Parent account created and linked!');
      }

      setNewParent({ username: '', email: '', password: '', first_name: '', last_name: '', student_id: '' });
      setIsCreatingParent(false);
      fetchData();
    } catch (err) {
      alert('Error saving parent account');
    } finally {
      setSaving(false);
    }
  };

  const handleEditParentClick = (parent) => {
    setEditingParent(parent);
    setIsCreatingParent(false);
    setNewParent({
      username: parent.username,
      email: parent.email,
      password: '', // Don't show password
      first_name: parent.first_name,
      last_name: parent.last_name,
      student_id: '' // You might want to pre-select the student if possible
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteParent = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'parent',
      id: id,
      title: 'Delete Parent Account',
      message: 'Are you sure you want to delete this parent account? This will unlink them from their child.'
    });
  };

  const confirmDeleteParent = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/parents/${deleteModal.id}/`);
      fetchData();
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Parent deleted successfully');
    } catch (err) {
      alert('Error deleting parent');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAttendanceForDate = async (date) => {
    setRefreshing(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const res = await api.get(`/api/attendance/?date=${dateStr}`);

      const attMap = {};
      res.data.forEach(att => {
        attMap[att.student] = att.status;
      });

      // Initialize missing students as ABSENT by default if no record exists
      const initialAtt = {};
      students.forEach(s => {
        initialAtt[s.id] = attMap[s.id] || 'ABSENT';
      });

      setAttendance(initialAtt);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchHomework = async (date) => {
    try {
      // Use local date formatting to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const res = await api.get(`/api/homework/?date=${formattedDate}`);
      setHomework(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'homework') {
      fetchHomework(selectedHomeworkDate);
    }
  }, [activeTab, selectedHomeworkDate]);

  const handlePostHomework = async (e) => {
    e.preventDefault();
    try {
      const classId = students[0]?.school_class;
      if (!classId) return alert("No class assigned");

      await api.post('/api/homework/', {
        ...homeworkForm,
        school_class: classId
      });

      alert('Homework posted successfully!');
      setHomeworkForm({ title: '', description: '', due_date: '' });
      fetchHomework(selectedHomeworkDate);
    } catch (err) {
      alert('Error posting homework');
    }
  };

  const handleDeleteHomework = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'homework',
      id: id,
      title: 'Delete Homework',
      message: 'This assignment will be removed for all students and parents. Continue?'
    });
  };

  const confirmDeleteHomework = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/homework/${deleteModal.id}/`);
      fetchHomework(selectedHomeworkDate);
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Homework deleted successfully');
    } catch (err) {
      alert('Error deleting homework');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const saveAttendance = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const promises = Object.entries(attendance).map(([studentId, status]) =>
        api.post('/api/attendance/', {
          student: studentId,
          date: dateStr,
          status: status
        })
      );
      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Error saving attendance');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalPhoto = newStudent.photo;
      if (finalPhoto) finalPhoto = await compressImage(finalPhoto);
      
      const formData = new FormData();
      formData.append('name', newStudent.name);
      formData.append('roll_number', newStudent.roll_number);
      if (stats.class_id) formData.append('school_class', stats.class_id);
      if (finalPhoto) formData.append('profile_picture', finalPhoto);

      await api.post('/api/students/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Student added successfully!');
      setNewStudent({ name: '', roll_number: '', photo: null });
      fetchStudents();
    } catch (err) {
      alert('Error adding student');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalPhoto = editingStudent.photo;
      if (finalPhoto) finalPhoto = await compressImage(finalPhoto);

      const formData = new FormData();
      formData.append('name', editingStudent.name);
      formData.append('roll_number', editingStudent.roll_number);
      if (finalPhoto) formData.append('profile_picture', finalPhoto);

      await api.patch(`/api/students/${editingStudent.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Student updated successfully!');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      alert('Error updating student');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        name: newExamForm.name,
        subjects: newExamForm.subjects
      };
      
      if (editingExam) {
        await api.put(`/api/exams/${editingExam.id}/`, payload);
        alert('Exam Updated Successfully!');
        // Refresh selectedExam if it was being viewed
        if (selectedExam?.id === editingExam.id) {
          const res = await api.get(`/api/exams/${editingExam.id}/`);
          setSelectedExam(res.data);
        }
        setEditingExam(null);
      } else {
        await api.post('/api/exams/', payload);
        alert('Exam Created Successfully!');
      }
      
      setNewExamForm({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
      setIsCreatingExam(false);
      fetchData();
    } catch (err) {
      alert('Failed: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

   const handleEditExamClick = (exam) => {
    setEditingExam(exam);
    setNewExamForm({
      name: exam.name,
      subjects: exam.subjects.map(s => ({ 
        id: s.id, 
        name: s.subject_name, 
        max_marks: s.max_marks,
        exam_date: s.exam_date || '',
        start_time: s.start_time || '',
        end_time: s.end_time || ''
      }))
    });
    setIsCreatingExam(false);
    setActiveTab('exam-timetable');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExam = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'exam',
      id: id,
      title: 'Delete Exam Category',
      message: 'This will permanently remove this exam category and all associated subject schedules. This action cannot be undone.'
    });
  };

  const confirmDeleteExam = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/exams/${deleteModal.id}/`);
      fetchData();
      if (selectedExam?.id === deleteModal.id) setSelectedExam(null);
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Exam Category deleted successfully');
    } catch (err) {
      alert('Error deleting exam');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteStudent = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'student',
      id: id,
      title: 'Delete Student Record',
      message: 'Are you sure you want to delete this student? All their academic records and attendance history will be lost.'
    });
  };

  const confirmDeleteStudent = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/students/${deleteModal.id}/`);
      fetchData();
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Student record deleted successfully');
    } catch (err) {
      alert('Error deleting student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'parent') confirmDeleteParent();
    else if (deleteModal.type === 'homework') confirmDeleteHomework();
    else if (deleteModal.type === 'exam') confirmDeleteExam();
    else if (deleteModal.type === 'student') confirmDeleteStudent();
  };

  const handleSaveResult = async (studentId, subjectId, marks) => {
    try {
      await api.post('/api/results/', {
        student: studentId,
        exam_subject: subjectId,
        obtained_marks: parseInt(marks)
      });
      fetchResultsForExam(selectedExam.id);
    } catch (err) {
      alert('Error saving result: ' + JSON.stringify(err.response?.data || err.message));
      console.error('Error saving result:', err);
    }
  };

  const [currentResults, setCurrentResults] = useState([]);
  const fetchResultsForExam = async (examId) => {
    try {
      const res = await api.get(`/api/results/?exam=${examId}`);
      setCurrentResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedExam) {
      fetchResultsForExam(selectedExam.id);
    }
  }, [selectedExam]);

  const toggleExamVisibility = async (id, currentStatus) => {
    try {
      await api.patch(`/api/exams/${id}/`, { is_visible: !currentStatus });
      fetchData();
      // If the exam being toggled is currently selected, update its local state too
      if (selectedExam?.id === id) {
        setSelectedExam({ ...selectedExam, is_visible: !currentStatus });
      }
    } catch (err) {
      alert('Error toggling visibility');
    }
  };

  const getUpcomingEvents = () => {
    const events = [];

    // Add Exam dates
    if (exams) {
      exams.forEach(exam => {
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

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navbar - Mobile Optimized */}
      <nav className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <span className="text-lg font-bold text-primary">SchoolSync</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-primary/5 hover:text-primary transition-all border border-slate-100 active:scale-95"
            title="Refresh Page"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={toggleLanguage}
            className="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-100"
          >
            {i18n.language === 'en' ? 'GUJ' : 'ENG'}
          </button>
          <div 
            onClick={() => window.location.href = '/profile'}
            className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-primary border border-slate-200"
          >
            <User size={18} />
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex-col sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen size={24} />
            </div>
            <span className="text-xl font-bold text-primary">SchoolSync</span>
          </div>

          <button 
            onClick={toggleLanguage}
            className="mb-6 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-4 py-3 rounded-2xl transition-all text-xs font-bold text-slate-700 border border-slate-100"
          >
            <Languages size={18} className="text-primary" />
            {i18n.language === 'en' ? 'ગુજરાતી' : 'English'}
          </button>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <LayoutDashboard size={20} /> {t('overview')}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={activeTab === 'students' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <Users size={20} /> {t('my_students')}
            </button>
            <button
              onClick={() => setActiveTab('homework')}
              className={activeTab === 'homework' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <Plus size={20} /> {t('post_homework')}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={activeTab === 'attendance' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <CheckSquare size={20} /> {t('attendance')}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={activeTab === 'results' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <ClipboardCheck size={20} /> {t('exam_results')}
            </button>
            <button
              onClick={() => setActiveTab('exam-timetable')}
              className={activeTab === 'exam-timetable' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <CalendarIcon size={20} /> {t('exam_timetable')}
            </button>
            <button
              onClick={() => setActiveTab('parents')}
              className={activeTab === 'parents' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <UserPlus size={20} /> {t('manage_parents')}
            </button>
          </nav>

          <button onClick={logout} className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 mt-auto">
            <LogOut size={20} /> {t('logout')}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
        {/* Announcement Banner */}
        {stats.announcement && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-xl flex items-center gap-4 animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Megaphone size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">{t('administrator_announcement')}</p>
              <p className="text-amber-700">{stats.announcement}</p>
            </div>
          </div>
        )}

        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Teacher Console</h2>
            <p className="text-slate-500">Class {stats.class_name} • Instructor: {localStorage.getItem('username')}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={fetchData}
              disabled={refreshing}
              className="hidden md:flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border-2 border-slate-100 shadow-sm text-slate-600 font-bold hover:bg-primary/5 hover:text-primary transition-all active:scale-95 group"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div
              onClick={() => window.location.href = '/profile'}
              className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all group"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all">
                <User size={18} />
              </div>
              <span className="font-semibold text-slate-700">{localStorage.getItem('username') || 'Teacher'}</span>
            </div>
            <div className="card flex items-center gap-3 px-6 py-3">
              <Users className="text-primary" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Students</p>
                <p className="font-bold">{stats.total_students}</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <CalendarIcon className="text-primary" /> {t('school_events_timeline')}
                </h3>
                <p className="text-slate-500 -mt-4">{t('school_events_desc')}</p>
                <EventsTimeline events={getUpcomingEvents()} />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Award className="text-primary" /> {t('upcoming_exams')}
                </h3>
                <div className="grid gap-4">
                  {exams?.filter(ex => ex.is_visible).slice(0, 3).map(exam => (
                    <div key={exam.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <h4 className="font-bold text-slate-800">{exam.name}</h4>
                       <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">{toGujarati(exam.subjects?.length)} {t('subjects')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-10">
            {/* Add Student Form */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                <Plus size={22} /> {t('add_new_student')}
              </h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('full_name')}</label>
                  <input 
                    type="text" className="input-field" placeholder={t('name')}
                    value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('roll_no')}</label>
                  <input 
                    type="text" className="input-field" placeholder={t('roll_no')}
                    value={newStudent.roll_number} onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <Camera size={14} /> {t('profile_photo')}
                  </label>
                  <input 
                    type="file" className="input-field py-1" accept="image/*"
                    onChange={e => setNewStudent({...newStudent, photo: e.target.files[0]})}
                  />
                </div>
                <button type="submit" className="btn-primary py-3">{t('add_student')}</button>
              </form>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{t('assigned_students')}</h3>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-all"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? t('refreshing') : t('refresh')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(student => (
                <div key={student.id} className="card hover:shadow-lg transition-all group overflow-hidden border-t-4 border-t-primary/10">
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => setViewingStudent(student)}
                      className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold text-xl overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    >
                      {student.profile_picture ? (
                        <img 
                          src={getImageUrl(student.profile_picture)} 
                          alt={student.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      ) : (
                        <User className="opacity-30" size={32} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{student.name}</h3>
                      <p className="text-sm text-slate-500">{t('roll')}: {toGujarati(student.roll_number)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Calendar on Top */}
            <div className="bg-white p-4 rounded-[3rem] border border-slate-100 shadow-2xl">
              <Calendar onDateSelect={setSelectedHomeworkDate} selectedDate={selectedHomeworkDate} />
            </div>

            {/* Post New Homework - Compact */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">{t('new_assignment')}</h3>
              </div>
              
              <form onSubmit={handlePostHomework} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text" className="input-field py-4" placeholder={t('assignment_title')}
                    value={homeworkForm.title} onChange={e => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                    required
                  />
                  <div className="relative">
                     <input
                      type="date" className="input-field py-4"
                      value={homeworkForm.due_date} onChange={e => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none">{t('due_date')}</span>
                  </div>
                </div>
                <textarea
                  className="input-field min-h-[120px] py-4" placeholder={t('instructions')}
                  value={homeworkForm.description} onChange={e => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  required
                ></textarea>
                <button type="submit" className="btn-primary w-full py-5 shadow-2xl shadow-primary/30 text-lg font-black rounded-2xl">
                   {t('publish_now')}
                </button>
              </form>
            </div>

            {/* Homework List - Vertical */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {t('tasks_for')} {selectedHomeworkDate.toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-US', { month: 'long', day: 'numeric' })}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {homework.map(hw => (
                  <div key={hw.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{hw.title}</h4>
                        <p className="text-xs font-semibold text-slate-400">{t('due_date')}: {toGujarati(hw.due_date)}</p>
                        <p className="text-slate-600 text-sm mt-3 leading-relaxed">{hw.description}</p>
                      </div>
                      <button onClick={() => handleDeleteHomework(hw.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {homework.length === 0 && (
                  <div className="bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[4rem] p-24 text-center">
                    <BookOpen size={60} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">{t('no_assignments_found')}</h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-20">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black text-indigo-900 tracking-tight">{t('attendance')}</h1>
              <p className="text-slate-500 font-bold">{t('class')} {toGujarati(stats.class_name)}</p>
            </div>

            <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5/50 p-6 rounded-[2.5rem] border border-primary/10/50 flex flex-col gap-4">
                <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary">
                  <Users size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-3xl font-black text-indigo-900">
                    {toGujarati(students.filter(s => attendance[s.id] === 'PRESENT').length)}/{toGujarati(students.length)}
                  </div>
                  <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{t('present_today')}</div>
                </div>
              </div>

              <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100/50 flex flex-col gap-4">
                <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600">
                  <UserPlus size={24} strokeWidth={2.5} className="rotate-45" />
                </div>
                <div>
                  <div className="text-3xl font-black text-orange-900">
                    {toGujarati(students.filter(s => attendance[s.id] === 'ABSENT' || !attendance[s.id]).length)}
                  </div>
                  <div className="text-[10px] font-black uppercase text-orange-400 tracking-widest">{t('absent')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-800">{t('students')}</h2>
                <span className="text-xs font-bold text-slate-400">{t('roll_no')}</span>
              </div>

              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden ring-2 ring-slate-50 flex items-center justify-center text-primary font-black">
                          {student.profile_picture ? (
                            <img 
                              src={getImageUrl(student.profile_picture)} 
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : student.name.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${attendance[student.id] === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{student.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-400">{t('roll_no')}: {toGujarati(student.roll_number) || 'N/A'}</span>
                          <span className="bg-green-50 text-[10px] font-black text-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">98% AVG</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAttendance(student.id)}
                        className={`px-4 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-xs uppercase
                          ${attendance[student.id] === 'PRESENT' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                            : 'bg-slate-50 text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
                      >
                        <CheckSquare size={16} strokeWidth={3} />
                        <span className="hidden sm:inline">{t('present')}</span>
                      </button>
                      <button
                        onClick={() => toggleAttendance(student.id)}
                        className={`px-4 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-xs uppercase
                          ${attendance[student.id] === 'ABSENT' || !attendance[student.id]
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                            : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600'}`}
                      >
                        <X size={16} strokeWidth={3} />
                        <span className="hidden sm:inline">{t('absent')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveAttendance}
              disabled={saving}
              className="fixed bottom-24 left-10 right-10 bg-primary text-white p-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all z-40 lg:relative lg:bottom-0 lg:left-0 lg:right-0 lg:w-full"
            >
              <Save size={24} strokeWidth={3} />
              {saving ? t('saving') : t('save_attendance')}
            </button>
          </div>
        )}
        {activeTab === 'parents' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-800">Parents Management</h2>
              <button 
                onClick={() => {
                  setEditingParent(null);
                  setIsCreatingParent(true);
                  setNewParent({ username: '', email: '', password: '', first_name: '', last_name: '', student_id: '' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                <Plus size={18} /> New Parent
              </button>
            </div>

            {(isCreatingParent || editingParent) && (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative mb-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{editingParent ? t('update_parent_account') : t('add_parent_account')}</h3>
                    <p className="text-slate-500 text-sm">Fill in the login credentials for the parent</p>
                  </div>
                  <button onClick={() => {
                    setEditingParent(null);
                    setIsCreatingParent(false);
                    setNewParent({ username: '', email: '', password: '', first_name: '', last_name: '', student_id: '' });
                  }} className="text-red-500 font-bold hover:underline">{t('cancel')}</button>
                </div>
                <form onSubmit={handleCreateParent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                    <input
                      type="text" className="input-field disabled:opacity-50" placeholder="John"
                      value={newParent.first_name} onChange={e => setNewParent({ ...newParent, first_name: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text" className="input-field disabled:opacity-50" placeholder="Doe"
                      value={newParent.last_name} onChange={e => setNewParent({ ...newParent, last_name: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('username')}</label>
                    <input
                      type="text" className="input-field disabled:opacity-50" placeholder="parent_username"
                      value={newParent.username} onChange={e => setNewParent({ ...newParent, username: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('email')}</label>
                    <input
                      type="email" className="input-field disabled:opacity-50" placeholder="parent@mail.com"
                      value={newParent.email} onChange={e => setNewParent({ ...newParent, email: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{editingParent ? "New Password (Optional)" : t('password')}</label>
                    <input
                      type="password" className="input-field disabled:opacity-50" placeholder="••••••••"
                      value={newParent.password} onChange={e => setNewParent({ ...newParent, password: e.target.value })}
                      required={!editingParent}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Link Student (Child)</label>
                    <select
                      className="input-field disabled:opacity-50"
                      value={newParent.student_id} onChange={e => setNewParent({ ...newParent, student_id: e.target.value })}
                      required
                      disabled={saving}
                    >
                      <option value="">Select Child</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({t('roll')}: {toGujarati(s.roll_number)})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary w-full py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    editingParent ? t('update_parent') : t('register_parent')
                  )}
                </button>
              </form>
            </div>
          )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Class Parents
                </h3>
                <button
                  onClick={fetchData}
                  disabled={refreshing}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-all"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Parent Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parents.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-700">{p.first_name} {p.last_name}</td>
                      <td className="px-6 py-4 text-slate-500">{p.email}</td>
                      <td className="px-6 py-4 text-slate-600">@{p.username}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditParentClick(p)}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Edit Account"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteParent(p.id)} 
                            className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Delete Account"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {parents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-400 italic">No parents registered in this class yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-800">{t('student_grading')}</h2>
                <p className="text-slate-500 mt-1">{t('select_exam_category_desc')}</p>
              </div>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-all"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? t('refreshing') : t('refresh')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.map(exam => (
                <div 
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all relative group ${
                    selectedExam?.id === exam.id 
                      ? 'bg-primary border-primary text-white shadow-2xl scale-105' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditExamClick(exam);
                      }}
                      className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                        selectedExam?.id === exam.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary/5 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                      className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                        selectedExam?.id === exam.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-50 text-red-400 hover:bg-red-100'
                      }`}
                    >
                      <Trash size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-4 rounded-2xl ${selectedExam?.id === exam.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                      <Award size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg leading-tight">{exam.name}</h4>
                      <p className={`text-xs mt-1 ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {t('click_to_start_grading')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedExam ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <ClipboardCheck className="text-primary" size={28} /> {t('grading_title', { name: selectedExam.name })}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEditExamClick(selectedExam)} 
                      className="bg-white/20 hover:bg-white/30 text-primary-dark border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Edit size={14} /> {t('edit_exam')}
                    </button>
                    <button onClick={() => setSelectedExam(null)} className="btn-secondary py-2 px-4 text-xs">{t('switch_exam')}</button>
                  </div>
                </div>
                <div className="overflow-x-auto relative min-h-[300px]">
                  {refreshing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 p-8">
                      <Skeleton type="table" />
                    </div>
                  )}
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('student_info')}</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('select_subject_to_mark')}</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('saved_performance')}</th>
                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">{t('aggregate')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map(student => {
                        const studentResults = currentResults.filter(r => r.student === student.id && r.exam_id === selectedExam.id);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-sm font-black text-primary">
                                  {student.profile_picture ? (
                                    <img src={getImageUrl(student.profile_picture)} className="w-full h-full object-cover" />
                                  ) : student.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-black text-slate-700 block">{student.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('roll_no')}: {toGujarati(student.roll_number)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-2">
                                <select 
                                  className="input-field py-2 text-sm font-bold bg-slate-50 border-none shadow-inner"
                                  onChange={(e) => {
                                    const subId = e.target.value;
                                    if (!subId) return;
                                    const sub = selectedExam.subjects.find(s => s.id === subId);
                                    const marks = prompt(`Enter marks for ${student.name} in ${sub.subject_name} (Max: ${sub.max_marks})`);
                                    if (marks) handleSaveResult(student.id, subId, marks);
                                    e.target.value = "";
                                  }}
                                >
                                  <option value="">{t('select_subject_prompt')}</option>
                                  {selectedExam.subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.subject_name} ({toGujarati(sub.max_marks)} {t('marks_label')}) 
                                      {sub.exam_date ? ` - ${toGujarati(sub.exam_date)}` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-wrap gap-2 max-w-[200px]">
                                {studentResults.length > 0 ? studentResults.map(r => (
                                  <div key={r.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm animate-in zoom-in duration-300">
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{r.subject_name}</p>
                                    <p className="text-sm font-black text-primary leading-none">{r.obtained_marks}<span className="text-[10px] text-slate-300 font-medium">/{r.max_marks}</span></p>
                                    {selectedExam.subjects.find(s => s.id === r.exam_subject)?.exam_date && (
                                      <p className="text-[8px] text-slate-400 mt-1">{selectedExam.subjects.find(s => s.id === r.exam_subject).exam_date}</p>
                                    )}
                                  </div>
                                )) : <span className="text-slate-300 text-xs italic font-medium">Awaiting Grades</span>}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {studentResults.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-lg font-black text-slate-800 leading-none">
                                    {Math.round((studentResults.reduce((acc, r) => acc + r.obtained_marks, 0) / studentResults.reduce((acc, r) => acc + r.max_marks, 0)) * 100)}%
                                  </p>
                                  <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all duration-1000" 
                                      style={{ width: `${(studentResults.reduce((acc, r) => acc + r.obtained_marks, 0) / studentResults.reduce((acc, r) => acc + r.max_marks, 0)) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                <GraduationCap size={80} className="mx-auto text-slate-200 mb-6 animate-pulse" />
                <h3 className="text-2xl font-black text-slate-400">Select an Exam Category to Begin Grading</h3>
                <p className="text-slate-400 mt-2 font-medium">Detailed subject management and performance tracking</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exam-timetable' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-800">Exam Timetable & Management</h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setEditingExam(null);
                    setIsCreatingExam(true);
                    setNewExamForm({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                  <Plus size={18} /> New Exam
                </button>
                <button onClick={() => fetchData()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                  <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Exam Creation/Edit Form */}
            {(isCreatingExam || editingExam) && (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary"></div>
                <h3 className="text-2xl font-black text-slate-800 mb-6">{editingExam ? 'Edit Exam Category' : 'Create New Exam Category'}</h3>
                <form onSubmit={handleAddExam} className="space-y-6">
                  <input 
                    type="text" placeholder="Exam Name (e.g., Final Term)" 
                    className="input-field py-4 text-lg font-bold w-full"
                    value={newExamForm.name} onChange={e => setNewExamForm({...newExamForm, name: e.target.value})}
                    required
                  />

                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Define Subjects & Schedule</p>
                    {newExamForm.subjects.map((sub, idx) => (
                      <div key={idx} className="grid grid-cols-1 lg:grid-cols-5 gap-3 animate-in slide-in-from-left duration-300 items-end">
                        <div className="lg:col-span-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Subject</label>
                          <input 
                            type="text" placeholder="Subject" 
                            className="input-field"
                            value={sub.name} onChange={e => {
                              const subs = [...newExamForm.subjects];
                              subs[idx].name = e.target.value;
                              setNewExamForm({...newExamForm, subjects: subs});
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Max Marks</label>
                          <input 
                            type="number" placeholder="Max" 
                            className="input-field"
                            value={sub.max_marks} onChange={e => {
                              const subs = [...newExamForm.subjects];
                              subs[idx].max_marks = parseInt(e.target.value);
                              setNewExamForm({...newExamForm, subjects: subs});
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Date</label>
                          <input 
                            type="date" 
                            className="input-field"
                            value={sub.exam_date || ''} onChange={e => {
                              const subs = [...newExamForm.subjects];
                              subs[idx].exam_date = e.target.value;
                              setNewExamForm({...newExamForm, subjects: subs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start Time</label>
                          <input 
                            type="time" 
                            className="input-field"
                            value={sub.start_time || ''} onChange={e => {
                              const subs = [...newExamForm.subjects];
                              subs[idx].start_time = e.target.value;
                              setNewExamForm({...newExamForm, subjects: subs});
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">End Time</label>
                            <input 
                              type="time" 
                              className="input-field"
                              value={sub.end_time || ''} onChange={e => {
                                const subs = [...newExamForm.subjects];
                                subs[idx].end_time = e.target.value;
                                setNewExamForm({...newExamForm, subjects: subs});
                              }}
                            />
                          </div>
                          {idx > 0 && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const subs = newExamForm.subjects.filter((_, i) => i !== idx);
                                setNewExamForm({...newExamForm, subjects: subs});
                              }}
                              className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setNewExamForm({...newExamForm, subjects: [...newExamForm.subjects, { name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }]})}
                      className="text-primary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
                    >
                      <Plus size={16} /> Add Another Subject
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" className="btn-primary flex-1 py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-3">
                      <GraduationCap size={20} /> {editingExam ? 'Update Exam Category' : 'Create Exam Category'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingExam(null);
                        setIsCreatingExam(false);
                        setNewExamForm({ name: '', subjects: [{ name: '', max_marks: 100, exam_date: '', start_time: '', end_time: '' }] });
                      }}
                      className="bg-slate-100 text-slate-600 px-8 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {exams.map(exam => (
                <div 
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`group p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative ${
                    selectedExam?.id === exam.id 
                      ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-primary/20 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditExamClick(exam);
                      }}
                      className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                        selectedExam?.id === exam.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary/5 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                      className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                        selectedExam?.id === exam.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-50 text-red-400 hover:bg-red-100'
                      }`}
                    >
                      <Trash size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${selectedExam?.id === exam.id ? 'bg-white/20' : 'bg-primary/5 text-primary'}`}>
                      <CalendarIcon size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{exam.name}</h4>
                      <p className={`text-xs mt-1 ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-slate-400'}`}>Click to view schedule</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${exam.is_visible ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedExam?.id === exam.id ? 'text-white/80' : 'text-slate-400'}`}>
                        {exam.is_visible ? 'Visible to Parents' : 'Hidden from Parents'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={exam.is_visible} 
                        onChange={() => toggleExamVisibility(exam.id, exam.is_visible)} 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
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
                      <h3 className="text-4xl font-black">{selectedExam.name} Timetable</h3>
                      <p className="text-primary-foreground/70 font-medium mt-1 uppercase tracking-widest">Official Examination Schedule</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleEditExamClick(selectedExam)} 
                        className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all flex items-center gap-2"
                      >
                        <Edit size={14} /> Edit Exam
                      </button>
                      <button onClick={() => setSelectedExam(null)} className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">Switch Exam</button>
                    </div>
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
              <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[4rem] p-32 text-center">
                <CalendarIcon size={80} className="mx-auto text-slate-200 mb-6 animate-pulse" />
                <h3 className="text-3xl font-black text-slate-400">{t('select_exam_category')}</h3>
                <p className="text-slate-400 mt-2 font-medium max-w-sm mx-auto text-lg">{t('click_to_view_schedule')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Student Modal */}
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
              <p className="text-primary font-bold tracking-widest uppercase text-sm mt-1">Student Profile</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Roll Number</p>
                  <p className="font-bold text-slate-700 text-lg">{viewingStudent.roll_number}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Class</p>
                  <p className="font-bold text-slate-700 text-lg">{viewingStudent.class_name}</p>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setViewingStudent(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Edit Student Record</h3>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditStudent} className="p-8 space-y-6">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 flex items-center justify-center">
                  {editingStudent.profile_picture ? (
                    <img src={getImageUrl(editingStudent.profile_picture)} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-300" size={40} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Update Photo</label>
                  <input 
                    type="file" accept="image/*"
                    onChange={e => setEditingStudent({...editingStudent, photo: e.target.files[0]})}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" className="input-field"
                    value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label>
                  <input 
                    type="text" className="input-field"
                    value={editingStudent.roll_number} onChange={e => setEditingStudent({...editingStudent, roll_number: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        isDeleting={isDeleting}
      />

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
                <Plus size={24} />
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-4 py-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`mobile-nav-item flex-1 ${activeTab === 'overview' ? 'mobile-nav-item-active' : ''}`}
          >
            <LayoutDashboard size={22} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('overview')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('students')}
            className={`mobile-nav-item flex-1 ${activeTab === 'students' ? 'mobile-nav-item-active' : ''}`}
          >
            <Users size={22} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('students')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('attendance')}
            className={`mobile-nav-item flex-1 ${activeTab === 'attendance' ? 'mobile-nav-item-active' : ''}`}
          >
            <CheckSquare size={22} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('attendance')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('parents')}
            className={`mobile-nav-item flex-1 ${activeTab === 'parents' ? 'mobile-nav-item-active' : ''}`}
          >
            <UserPlus size={22} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('manage_parents')}</span>
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`mobile-nav-item flex-1 ${isMobileMenuOpen ? 'mobile-nav-item-active' : ''}`}
          >
            <Menu size={22} />
            <span className="text-[10px] uppercase font-black tracking-tighter">{t('more')}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default TeacherDashboard;
