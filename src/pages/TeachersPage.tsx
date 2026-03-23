import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { Teacher } from '@/types/lms';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

const defaultForm: TeacherFormData = { name: '', email: '', phone: '', specialization: '' };

const TeachersPage: React.FC = () => {
  const { teachers, groups, addTeacher, updateTeacher, deleteTeacher } = useLMS();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<TeacherFormData>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTeacher(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setForm({ name: t.name, email: t.email, phone: t.phone, specialization: t.specialization });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Partial<TeacherFormData> = {};
    if (!form.name.trim()) e.name = 'Name required' as any;
    if (!form.email.includes('@')) e.email = 'Valid email required' as any;
    if (!form.specialization.trim()) e.specialization = 'Specialization required' as any;
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editTeacher) {
      updateTeacher(editTeacher.id, form);
      toast.success('Teacher updated');
    } else {
      addTeacher({ ...form, userId: Math.random().toString(36).substr(2, 9), assignedGroups: [] });
      toast.success('Teacher created');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTeacher(id);
    toast.success(`${name} removed`);
  };

  const getTeacherGroups = (teacherId: string) =>
    groups.filter(g => g.teacherId === teacherId);

  const specializationColors = [
    'bg-blue-50 text-blue-700',
    'bg-purple-50 text-purple-700',
    'bg-amber-50 text-amber-700',
    'bg-teal-50 text-teal-700',
    'bg-rose-50 text-rose-700',
  ];

  return (
    <MainLayout title="Teachers" allowedRoles={['admin']}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.97] shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>

        {/* Teacher Cards */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((teacher, i) => {
            const teacherGroups = getTeacherGroups(teacher.id);
            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer group"
                onClick={() => setSelectedTeacher(teacher)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white">
                      {teacher.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {teacher.name}
                      </h3>
                      <p className="text-xs text-slate-400">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(teacher)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(teacher.id, teacher.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${specializationColors[i % specializationColors.length]}`}>
                  {teacher.specialization}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Groups</p>
                  {teacherGroups.length === 0 ? (
                    <p className="text-xs text-slate-400">No groups assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {teacherGroups.map(g => (
                        <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-md border border-teal-100">
                          <BookMarked className="w-2.5 h-2.5" />
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    Since {teacher.createdAt}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {teacherGroups.length} groups
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No teachers found</p>
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {selectedTeacher.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedTeacher.name}</h2>
                      <p className="text-slate-300 text-sm">{selectedTeacher.specialization}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTeacher(null)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {[['Email', selectedTeacher.email], ['Phone', selectedTeacher.phone], ['Member Since', selectedTeacher.createdAt]].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Assigned Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {getTeacherGroups(selectedTeacher.id).map(g => (
                      <span key={g.id} className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs rounded-lg border border-teal-100 font-medium">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTeacher(null); openEdit(selectedTeacher); }}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editTeacher ? 'Edit Teacher' : 'Add Teacher'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'Jane Doe' },
                  { label: 'Email', key: 'email' as const, type: 'email', placeholder: 'jane@school.com' },
                  { label: 'Phone', key: 'phone' as const, type: 'text', placeholder: '+1 555-0200' },
                  { label: 'Specialization', key: 'specialization' as const, type: 'text', placeholder: 'Business English' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${(errors as any)[key] ? 'border-red-400' : 'border-slate-200 focus:border-teal-400'}`}
                    />
                    {(errors as any)[key] && <p className="text-xs text-red-500 mt-1">{(errors as any)[key]}</p>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  {editTeacher ? 'Save Changes' : 'Create Teacher'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default TeachersPage;
