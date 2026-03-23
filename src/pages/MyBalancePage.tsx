import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const MyBalancePage: React.FC = () => {
  const { students, payments } = useLMS();
  const { user } = useAuth();

  const student = students.find(s => s.userId === user?.id);
  const myPayments = payments
    .filter(p => p.studentId === student?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const deposits = myPayments.filter(p => p.type === 'DEPOSIT').reduce((s, p) => s + p.amount, 0);
  const spent = myPayments.filter(p => p.type === 'LESSON_PAYMENT').reduce((s, p) => s + p.amount, 0);

  return (
    <MainLayout title="My Balance" allowedRoles={['student']}>
      <div className="space-y-5">
        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{student?.name}</p>
              <p className="text-xs text-slate-500">Level: {student?.level}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-1">Current Balance</p>
          <p className="text-5xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            ${student?.balance.toFixed(2) || '0.00'}
          </p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-400">Total Deposited</p>
              <p className="text-lg font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                +${deposits.toFixed(2)}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-xs text-slate-400">Total Spent</p>
              <p className="text-lg font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ${Math.abs(spent).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment history */}
        <div>
          <h2 className="font-bold text-slate-700 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Payment History
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {myPayments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No transactions yet</div>
            ) : (
              myPayments.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`px-5 py-4 flex items-center justify-between ${i !== 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      payment.type === 'DEPOSIT' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {payment.type === 'DEPOSIT'
                        ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                        : <TrendingDown className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{payment.description}</p>
                      <p className="text-xs text-slate-400 font-mono">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${payment.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {payment.amount > 0 ? '+' : ''}${Math.abs(payment.amount).toFixed(2)}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      payment.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {payment.type === 'DEPOSIT' ? 'DEPOSIT' : 'LESSON'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyBalancePage;
