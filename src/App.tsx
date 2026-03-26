import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { LMSProvider } from "@/contexts/LMSContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import TeachersPage from "@/pages/TeachersPage";
import GroupsPage from "@/pages/GroupsPage";
import SchedulePage from "@/pages/SchedulePage";
import PaymentsPage from "@/pages/PaymentsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AttendancePage from "@/pages/AttendancePage";
import MyLessonsPage from "@/pages/MyLessonsPage";
import BookLessonPage from "@/pages/BookLessonPage";
import MyBalancePage from "@/pages/MyBalancePage";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LMSProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/my-lessons" element={<MyLessonsPage />} />
              <Route path="/book-lesson" element={<BookLessonPage />} />
              <Route path="/my-balance" element={<MyBalancePage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                },
              }}
            />
          </Suspense>
        </LMSProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
