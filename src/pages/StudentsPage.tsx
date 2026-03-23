import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { Student, EnglishLevel } from '@/types/lms';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, X, DollarSign,
  ChevronUp, ChevronDown, User
} from 'lucide-react';
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

interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  level: EnglishLevel;
  balance: number;
}

const defaultForm: StudentFormData = {
  name: '', email: '', phone: '', level: 'A1', balance: 0,
};

const StudentsPage: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, addPayment } = useLMS();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});
  const [sortKey, setSortKey] = useState<keyof Student>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [depositModal, setDepositModal] = useState<Student | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = students
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const openCreate = () => {
    setEditStudent(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({ name: s.name, email: s.email, phone: s.phone, level: s.level, balance: s.balance });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Partial<StudentFormData> = {};
    if (!form.name.trim()) e.name = 'Name is required' as any;
    if (!form.email.includes('@')) e.email = 'Valid email required' as any;
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editStudent) {
      updateStudent(editStudent.id, form);
      toast.success('Student updated successfully');
    } else {
      addStudent({ ...form, userId: Math.random().toString(36).substr(2, 9), enrolledGroups: [] });
      toast.success('Student created successfully');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteStudent(id);
    toast.success(`${name} removed`);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!depositModal) return;
    addPayment({ studentId: depositModal.id, amount, type: 'DEPOSIT', description: 'Manual deposit', date: new Date().toISOString().split('T')[0] });
    toast.success(`$${amount} deposited for ${depositModal.name}`);
    setDepositModal(null);
    setDepositAmount('');
  };

  const toggleSort = (key: keyof Student) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: keyof Student }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${sortKey === col && sortDir === 'asc' ? 'text-teal-500' : 'text-slate-300'}`} />
      <ChevronDown className={`w-2.5 h-2.5 ${sortKey === col && sortDir === 'desc' ? 'text-teal-500' : 'text-slate-300'}`} />
    </span>
  );

  return (
    <MainLayout title="Students" allowedRoles={['admin']}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.97] shadow-sm"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {([['name', 'Student'], ['email', 'Email'], ['level', 'Level'], ['balance', 'Balance'], ['createdAt', 'Joined']] as [keyof Student, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
                      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {label} <SortIcon col={key} />
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{student.name}</p>
                          <p className="text-[11px] text-slate-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{student.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{student.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${levelColors[student.level]}`}>
                        {student.level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold ${student.balance < 100 ? 'text-red-500' : 'text-emerald-600'}`}
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ${student.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{student.createdAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setDepositModal(student); setDepositAmount(''); }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Add Deposit"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(student)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No students found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedStudent.name}</h2>
                      <p className="text-teal-100 text-sm">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  ['Phone', selectedStudent.phone],
                  ['Level', selectedStudent.level],
                  ['Enrolled Groups', selectedStudent.enrolledGroups.length.toString()],
                  ['Member Since', selectedStudent.createdAt],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</span>
                    <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-500">Balance</span>
                  <span className={`text-lg font-bold ${selectedStudent.balance < 100 ? 'text-red-500' : 'text-emerald-600'}`}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    ${selectedStudent.balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setSelectedStudent(null); openEdit(selectedStudent); }}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg transition-colors">
                    Edit Profile
                  </button>
                  <button onClick={() => { setSelectedStudent(null); setDepositModal(selectedStudent); setDepositAmount(''); }}
                    className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold rounded-lg transition-colors">
                    Add Deposit
                  </button>
                </div>
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
                  {editStudent ? 'Edit Student' : 'Add Student'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'John Doe' },
                  { label: 'Email', key: 'email' as const, type: 'email', placeholder: 'john@example.com' },
                  { label: 'Phone', key: 'phone' as const, type: 'text', placeholder: '+1 555-0100' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</label>
                    <input
                      type={type}
                      value={form[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${(errors as any)[key] ? 'border-red-400' : 'border-slate-200 focus:border-teal-400'}`}
                      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    />
                    {(errors as any)[key] && <p className="text-xs text-red-500 mt-1">{(errors as any)[key]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">English Level</label>
                  <select
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value as EnglishLevel }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {!editStudent && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance ($)</label>
                    <input
                      type="number"
                      value={form.balance}
                      onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {editStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {depositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Add Deposit</h2>
                <button onClick={() => setDepositModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                    {depositModal.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{depositModal.name}</p>
                    <p className="text-xs text-slate-400">Current balance: <span className="font-semibold text-emerald-600">${depositModal.balance.toFixed(2)}</span></p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setDepositModal(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeposit} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  Deposit Funds
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default StudentsPage;
