import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { revenueData, attendanceData, workloadData } from '@/data/mockData';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('year');

  const filteredRevenue = dateRange === 'year'
    ? revenueData
    : dateRange === 'h1'
    ? revenueData.slice(0, 6)
    : revenueData.slice(6, 12);

  const totalRevenue = filteredRevenue.reduce((s, d) => s + d.revenue, 0);
  const avgAttendance = Math.round(attendanceData.reduce((s, d) => s + d.rate, 0) / attendanceData.length);
  const topTeacher = workloadData.reduce((a, b) => a.lessons > b.lessons ? a : b);

  return (
    <MainLayout title="Analytics" allowedRoles={['admin']}>
      <div className="space-y-5">
        {/* Date range filter */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Performance Analytics</h2>
            <p className="text-sm text-slate-400 mt-0.5">Key metrics and trends overview</p>
          </div>
          <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-slate-200">
            {[['year', 'Full Year'], ['h1', 'Jan–Jun'], ['h2', 'Jul–Dec']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDateRange(val)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dateRange === val ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: `${filteredRevenue.length} months`, color: 'from-teal-500 to-teal-600' },
            { label: 'Avg Attendance Rate', value: `${avgAttendance}%`, sub: 'across all lessons', color: 'from-blue-500 to-blue-600' },
            { label: 'Top Teacher', value: topTeacher.teacher.split(' ')[0], sub: `${topTeacher.lessons} lessons`, color: 'from-amber-500 to-amber-600' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white shadow-lg`}
            >
              <p className="text-sm font-medium text-white/80 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{kpi.label}</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{kpi.value}</p>
              <p className="text-xs text-white/60 mt-1">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Revenue per Month</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly deposit income in USD</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-emerald-500 font-medium">Total period</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredRevenue} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: 13 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="revenue" fill="url(#tealGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Two charts side by side */}
        <div className="grid grid-cols-2 gap-5">
          {/* Attendance Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <h3 className="font-bold text-slate-800 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Lesson Attendance Rate</h3>
            <p className="text-xs text-slate-400 mb-5">Weekly % of students present</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Attendance']}
                />
                <Line dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Teacher Workload */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <h3 className="font-bold text-slate-800 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Teacher Workload</h3>
            <p className="text-xs text-slate-400 mb-5">Lessons per teacher this month</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={workloadData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="teacher" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }}
                  formatter={(v: number) => [v, 'Lessons']}
                />
                <Bar dataKey="lessons" fill="#f59e0b" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
