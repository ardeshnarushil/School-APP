import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Users, BookOpen, Settings, Plus, 
  Trash2, UserPlus, LogOut, LayoutDashboard,
  Shield, GraduationCap, Briefcase, User, RefreshCw, Bell, Send
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Loader from '../../components/Loader';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Forms
  const [newClass, setNewClass] = useState({ name: '', teacher: '' });
  const [newTeacher, setNewTeacher] = useState({ username: '', password: '', first_name: '', last_name: '', email: '' });
  const [notice, setNotice] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];


  useEffect(() => {
    fetchData();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [classesRes, statsRes, teachersRes] = await Promise.all([
        api.get('/api/classes/'),
        api.get('/api/dashboard-stats/'),
        api.get('/api/teachers/')
      ]);
      setClasses(classesRes.data);
      setStats(statsRes.data);
      setTeachers(teachersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/api/classes/${editingClass.id}/`, newClass);
        setEditingClass(null);
      } else {
        await api.post('/api/classes/', newClass);
      }
      setNewClass({ name: '', teacher: '' });
      fetchData();
    } catch (err) {
      alert('Error saving class');
    }
  };

  const handleEditClass = (cls) => {
    setEditingClass(cls);
    setNewClass({ name: cls.name, teacher: cls.teacher });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClass = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'class',
      id: id,
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? This will affect all students and records associated with it.'
    });
  };

  const confirmDeleteClass = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/classes/${deleteModal.id}/`);
      fetchData();
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Class deleted successfully');
    } catch (err) {
      alert('Error deleting class');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const payload = { ...newTeacher };
        if (!payload.password) delete payload.password;
        await api.put(`/api/teachers/${editingTeacher.id}/`, payload);
        setEditingTeacher(null);
      } else {
        await api.post('/api/teachers/', newTeacher);
      }
      setNewTeacher({ username: '', password: '', first_name: '', last_name: '', email: '' });
      fetchData();
    } catch (err) {
      alert('Error saving teacher account: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setNewTeacher({ 
      username: teacher.username, 
      password: '', 
      first_name: teacher.first_name, 
      last_name: teacher.last_name, 
      email: teacher.email 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTeacher = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'teacher',
      id: id,
      title: 'Delete Teacher Account',
      message: 'Are you sure you want to delete this teacher account? This action cannot be undone.'
    });
  };

  const confirmDeleteTeacher = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/teachers/${deleteModal.id}/`);
      fetchData();
      setDeleteModal({ ...deleteModal, isOpen: false });
      alert('Teacher account deleted successfully');
    } catch (err) {
      alert('Error deleting teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'class') confirmDeleteClass();
    else if (deleteModal.type === 'teacher') confirmDeleteTeacher();
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/notices/', { content: notice });
      setNotice('');
      alert('Notice posted successfully!');
      fetchData();
    } catch (err) {
      alert('Error posting notice');
    }
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
            <Shield size={18} />
          </div>
          <span className="text-lg font-bold text-primary">SchoolSync Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            onClick={() => window.location.href = '/profile'}
            className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-primary border border-slate-200"
          >
            <User size={18} />
          </div>
          <button onClick={logout} className="text-slate-400">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex flex-col sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield size={24} />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">SchoolSync</span>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <LayoutDashboard size={20} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('teachers')}
              className={activeTab === 'teachers' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <Briefcase size={20} /> Manage Teachers
            </button>
            <button 
              onClick={() => setActiveTab('classes')}
              className={activeTab === 'classes' ? 'sidebar-link-active w-full' : 'sidebar-link w-full'}
            >
              <GraduationCap size={20} /> Manage Classes
            </button>
          </nav>

          <button onClick={logout} className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 mt-auto">
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
          <header className="hidden md:flex mb-10 justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Admin Console</h2>
              <p className="text-slate-500 mt-1">Institutional Oversight & Management</p>
            </div>
            <div 
              onClick={() => window.location.href = '/profile'}
              className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all group"
            >
               <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all">
                 <User size={18} />
               </div>
               <span className="font-semibold text-slate-700">{localStorage.getItem('username') || 'Admin'}</span>
            </div>
          </header>

        
        {refreshing && activeTab !== 'overview' && (
          <div className="fixed top-20 right-8 z-50">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-primary/20">
              <RefreshCw size={20} className="text-primary animate-spin" />
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card bg-primary text-white border-none p-8 flex flex-col justify-between shadow-xl shadow-primary/20">
                <div>
                  <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-2">Total Classes</p>
                  <p className="text-5xl font-bold">{stats.total_classes}</p>
                </div>
                <BookOpen className="opacity-10 self-end" size={48} />
              </div>
              <div className="card bg-secondary text-white border-none p-8 flex flex-col justify-between shadow-xl shadow-secondary/20">
                <div>
                  <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-2">Active Teachers</p>
                  <p className="text-5xl font-bold">{stats.total_teachers}</p>
                </div>
                <Briefcase className="opacity-10 self-end" size={48} />
              </div>
              <div className="card bg-white p-8 flex flex-col justify-between shadow-sm border border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Enrolled Students</p>
                  <p className="text-5xl font-bold text-primary">{stats.total_students}</p>
                </div>
                <Users className="opacity-5 self-end text-primary" size={48} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Distribution Chart */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-slate-800">User Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.user_distribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(stats.user_distribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Notice Board Form */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                  <Bell className="text-primary" size={20} /> Broadcast Announcement
                </h3>
                <form onSubmit={handlePostNotice} className="space-y-4">
                  <textarea
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Write an announcement for all teachers and parents..."
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                    <Send size={18} /> Post Announcement
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="space-y-10">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <UserPlus size={22} /> {editingTeacher ? 'Update Teacher Account' : 'Add New Teacher'}
                </h3>
                {editingTeacher && (
                  <button onClick={() => {
                    setEditingTeacher(null);
                    setNewTeacher({ username: '', password: '', first_name: '', last_name: '', email: '' });
                  }} className="text-red-500 font-bold hover:underline">Cancel Edit</button>
                )}
              </div>
              <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                  <input 
                    type="text" className="input-field" placeholder="hani_smith"
                    value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <input 
                    type="password" className="input-field" placeholder={editingTeacher ? "Leave blank to keep same" : "••••••••"}
                    value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                    required={!editingTeacher}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" className="input-field" placeholder="hani@school.com"
                    value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                  <input 
                    type="text" className="input-field" placeholder="Hani"
                    value={newTeacher.first_name} onChange={e => setNewTeacher({...newTeacher, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                  <input 
                    type="text" className="input-field" placeholder="Smith"
                    value={newTeacher.last_name} onChange={e => setNewTeacher({...newTeacher, last_name: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn-primary w-full py-2.5">
                    {editingTeacher ? 'Update Teacher' : 'Register Teacher'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Teacher Roster
                </h3>
                <button 
                  onClick={fetchData} 
                  disabled={refreshing}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-700">{t.first_name} {t.last_name}</td>
                      <td className="px-6 py-4 text-slate-600">@{t.username}</td>
                      <td className="px-6 py-4 text-slate-500">{t.email}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEditTeacher(t)} className="text-primary hover:text-primary-dark transition-colors p-2 hover:bg-primary/5 rounded-lg">
                          <Plus size={18} />
                        </button>
                        <button onClick={() => handleDeleteTeacher(t.id)} className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-10">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Plus size={22} /> {editingClass ? 'Update Class' : 'Create Class'}
                </h3>
                {editingClass && (
                  <button onClick={() => {
                    setEditingClass(null);
                    setNewClass({ name: '', teacher: '' });
                  }} className="text-red-500 font-bold hover:underline">Cancel Edit</button>
                )}
              </div>
              <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Class Name</label>
                  <input 
                    type="text" className="input-field" placeholder="e.g., 1A, 10C"
                    value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assign Teacher</label>
                  <select 
                    className="input-field"
                    value={newClass.teacher} onChange={e => setNewClass({...newClass, teacher: e.target.value})}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary py-2.5">
                  {editingClass ? 'Update Class' : 'Add Class'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary" /> Active Classes
                </h3>
                <button 
                  onClick={fetchData} 
                  disabled={refreshing}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Class</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Teacher</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4">
                        <span className="bg-primary-container text-primary font-bold px-3 py-1 rounded-full text-sm">
                          {c.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{c.teacher_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEditClass(c)} className="text-primary hover:text-primary-dark transition-colors p-2 hover:bg-primary/5 rounded-lg">
                          <Plus size={18} />
                        </button>
                        <button onClick={() => handleDeleteClass(c.id)} className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        isDeleting={isDeleting}
      />
      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 pb-safe">
        <div className="flex justify-around items-center px-2 py-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`mobile-nav-item flex-1 ${activeTab === 'overview' ? 'mobile-nav-item-active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`mobile-nav-item flex-1 ${activeTab === 'teachers' ? 'mobile-nav-item-active' : ''}`}
          >
            <Briefcase size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">Teachers</span>
          </button>

          <button 
            onClick={() => setActiveTab('classes')}
            className={`mobile-nav-item flex-1 ${activeTab === 'classes' ? 'mobile-nav-item-active' : ''}`}
          >
            <GraduationCap size={20} />
            <span className="text-[10px] uppercase font-black tracking-tighter">Classes</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
