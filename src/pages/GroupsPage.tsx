import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { Group, EnglishLevel } from '@/types/lms';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Users, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

const LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const levelColors: Record<EnglishLevel, string> = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-50 text-blue-600',
  B1: 'bg-teal-50 text-teal-700',
  B2: 'bg-purple-50 text-purple-700',
  C1: 'bg-amber-50 text-amber-700',
  C2: 'bg-emerald-50 text-emerald-700',
};

interface GroupFormData {
  name: string;
  level: EnglishLevel;
  teacherId: string;
  maxStudents: number;
  studentIds: string[];
}

const defaultForm: GroupFormData = { name: '', level: 'A1', teacherId: '', maxStudents: 6, studentIds: [] };

const GroupsPage: React.FC = () => {
  const { groups, teachers, students, addGroup, updateGroup, deleteGroup } = useLMS();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [form, setForm] = useState<GroupFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<GroupFormData>>({});
  const [studentSearch, setStudentSearch] = useState('');

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditGroup(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (g: Group) => {
    setEditGroup(g);
    setForm({ name: g.name, level: g.level, teacherId: g.teacherId, maxStudents: g.maxStudents, studentIds: [...g.studentIds] });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Partial<GroupFormData> = {};
    if (!form.name.trim()) e.name = 'Name required' as any;
    if (!form.teacherId) e.teacherId = 'Teacher required' as any;
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editGroup) {
      updateGroup(editGroup.id, form);
      toast.success('Group updated');
    } else {
      addGroup(form);
      toast.success('Group created');
    }
    setShowModal(false);
  };

  const toggleStudent = (studentId: string) => {
    setForm(f => ({
      ...f,
      studentIds: f.studentIds.includes(studentId)
        ? f.studentIds.filter(id => id !== studentId)
        : [...f.studentIds, studentId],
    }));
  };

  const filteredStudentsForForm = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <MainLayout title="Groups" allowedRoles={['admin', 'teacher']}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.97] shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Group
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((group, i) => {
            const teacher = teachers.find(t => t.id === group.teacherId);
            const groupStudents = students.filter(s => group.studentIds.includes(s.id));
            const fillPercent = (group.studentIds.length / group.maxStudents) * 100;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <BookMarked className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>{group.name}</h3>
                      <p className="text-xs text-slate-500">{teacher?.name || 'No teacher'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(group)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { deleteGroup(group.id); toast.success('Group deleted'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${levelColors[group.level]}`}>
                    {group.level}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.studentIds.length}/{group.maxStudents} students
                  </span>
                </div>

                {/* Fill bar */}
                <div className="mb-4">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fillPercent >= 90 ? 'bg-red-400' : fillPercent >= 70 ? 'bg-amber-400' : 'bg-teal-500'}`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                {/* Student avatars */}
                <div className="flex items-center gap-1">
                  {groupStudents.slice(0, 5).map(s => (
                    <div key={s.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 -ml-1 first:ml-0" title={s.name}>
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {groupStudents.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 -ml-1">
                      +{groupStudents.length - 5}
                    </div>
                  )}
                  {groupStudents.length === 0 && (
                    <span className="text-xs text-slate-400">No students yet</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No groups found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editGroup ? 'Edit Group' : 'Create Group'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Business English Intermediate"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${(errors as any).name ? 'border-red-400' : 'border-slate-200 focus:border-teal-400'}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                    <select
                      value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: e.target.value as EnglishLevel }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Students</label>
                    <input
                      type="number"
                      value={form.maxStudents}
                      onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign Teacher</label>
                  <select
                    value={form.teacherId}
                    onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${(errors as any).teacherId ? 'border-red-400' : 'border-slate-200'}`}
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Add Students ({form.studentIds.length} selected)
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredStudentsForForm.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.studentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="accent-teal-600"
                        />
                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 flex-shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{s.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{s.level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  {editGroup ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default GroupsPage;
