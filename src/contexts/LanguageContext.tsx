import React, { createContext, useContext } from 'react';

interface LanguageContextType {
  t: (key: string) => string;
}

const translations = {
  // Navigation
  'nav.dashboard': 'Панель',
  'nav.students': 'Студенти',
  'nav.teachers': 'Викладачі',
  'nav.groups': 'Групи',
  'nav.schedule': 'Розклад',
  'nav.myLessons': 'Мої заняття',
  'nav.bookLesson': 'Забронювати',
  'nav.payments': 'Платежі',
  'nav.myBalance': 'Мій баланс',
  'nav.analytics': 'Аналітика',
  'nav.attendance': 'Відвідуваність',
  'nav.logout': 'Вийти',
  
  // Sidebar
  'sidebar.schoolManagement': 'Управління школою',
  'sidebar.loggedOut': 'Ви успішно вийшли з системи',
  
  // Roles
  'role.admin': 'адміністратор',
  'role.teacher': 'викладач',
  'role.student': 'студент',
  
  // Common
  'common.loading': 'Завантаження...',
  'common.save': 'Зберегти',
  'common.cancel': 'Скасувати',
  'common.delete': 'Видалити',
  'common.edit': 'Редагувати',
  'common.add': 'Додати',
  'common.search': 'Пошук',
  'common.filter': 'Фільтр',
  'common.export': 'Експорт',
  'common.import': 'Імпорт',
  
  // Students
  'students.title': 'Студенти',
  'students.addStudent': 'Додати студента',
  'students.editStudent': 'Редагувати студента',
  'students.name': 'Ім\'я',
  'students.email': 'Email',
  'students.phone': 'Телефон',
  'students.level': 'Рівень',
  'students.balance': 'Баланс',
  'students.enrolledGroups': 'Записані групи',
  
  // Teachers
  'teachers.title': 'Викладачі',
  'teachers.addTeacher': 'Додати викладача',
  'teachers.editTeacher': 'Редагувати викладача',
  'teachers.specialization': 'Спеціалізація',
  'teachers.assignedGroups': 'Призначені групи',
  
  // Groups
  'groups.title': 'Групи',
  'groups.addGroup': 'Додати групу',
  'groups.editGroup': 'Редагувати групу',
  'groups.name': 'Назва',
  'groups.level': 'Рівень',
  'groups.teacher': 'Викладач',
  'groups.maxStudents': 'Макс. студентів',
  'groups.currentStudents': 'Поточні студенти',
  
  // Schedule
  'schedule.title': 'Розклад',
  'schedule.addLesson': 'Додати заняття',
  'schedule.editLesson': 'Редагувати заняття',
  'schedule.lessonTitle': 'Назва',
  'schedule.type': 'Тип',
  'schedule.status': 'Статус',
  'schedule.classroom': 'Аудиторія',
  'schedule.startTime': 'Час початку',
  'schedule.endTime': 'Час закінчення',
  'schedule.cost': 'Вартість',
  
  // Payments
  'payments.title': 'Платежі',
  'payments.addPayment': 'Додати платіж',
  'payments.amount': 'Сума',
  'payments.type': 'Тип',
  'payments.description': 'Опис',
  'payments.date': 'Дата',
  
  // Notifications
  'notifications.newStudent': 'Новий студент зареєстрований',
  'notifications.paymentReceived': 'Отримано платіж',
  'notifications.lessonCompleted': 'Заняття завершено',
  'notifications.lowBalance': 'Низький баланс',
  
  // Currency
  'currency.uah': '₴',
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default LanguageContext;
