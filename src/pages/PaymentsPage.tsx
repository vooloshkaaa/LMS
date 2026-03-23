import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { motion } from 'framer-motion';
import { Search, DollarSign, TrendingUp, CreditCard } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const { payments, students } = useLMS();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'ALL' | 'DEPOSIT' | 'LESSON_PAYMENT'>('ALL');
  const PER_PAGE = 12;

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  const filtered = payments
    .filter(p => {
      const name = getStudentName(p.studentId).toLowerCase();
      const matchSearch = name.includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || p.type === filterType;
      return matchSearch && matchType;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalDeposits = payments.filter(p => p.type === 'DEPOSIT').reduce((s, p) => s + p.amount, 0);
  const totalLessonPayments = payments.filter(p => p.type === 'LESSON_PAYMENT').reduce((s, p) => s + p.amount, 0);

  return (
    <MainLayout title="Payments" allowedRoles={['admin']}>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Deposits', value: `$${totalDeposits.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
            { label: 'Lesson Revenue', value: `$${Math.abs(totalLessonPayments).toLocaleString()}`, icon: CreditCard, color: 'bg-blue-50 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
            { label: 'Total Transactions', value: payments.length, icon: DollarSign, color: 'bg-teal-50 text-teal-600', badge: 'bg-teal-100 text-teal-700' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search payments..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div className="flex gap-1.5">
              {(['ALL', 'DEPOSIT', 'LESSON_PAYMENT'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === type ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {type === 'ALL' ? 'All' : type === 'DEPOSIT' ? 'Deposits' : 'Lesson'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Student', 'Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((payment, i) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                          {getStudentName(payment.studentId).split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{getStudentName(payment.studentId)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        payment.type === 'DEPOSIT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {payment.type === 'DEPOSIT' ? 'DEPOSIT' : 'LESSON'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${payment.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {payment.amount > 0 ? '+' : ''}{payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{payment.description}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{payment.date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">No payments found</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentsPage;
