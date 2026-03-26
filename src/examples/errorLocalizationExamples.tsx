import React, { useState } from 'react';
import { 
  errorHandler, 
  createError, 
  handleNetworkError, 
  handleValidationError, 
  handleAuthError 
} from '../utils/errorHandler';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { 
  NotFoundPage, 
  AccessDeniedPage, 
  ServerErrorPage, 
  NetworkErrorPage 
} from '../pages/ErrorPages';

// Приклади використання локалізованих помилок
export const ErrorLocalizationExamples: React.FC = () => {
  const [currentError, setCurrentError] = useState<any>(null);
  const [showPage, setShowPage] = useState<string | null>(null);

  const triggerNetworkError = () => {
    const error = handleNetworkError(
      new Error('Connection timeout'),
      {
        endpoint: '/api/students',
        method: 'GET',
        userId: 'user123'
      }
    );
    setCurrentError(error);
  };

  const triggerAuthError = () => {
    const error = handleAuthError(
      new Error('Invalid credentials'),
      true,
      {
        component: 'LoginForm',
        action: 'login',
        email: 'user@example.com'
      }
    );
    setCurrentError(error);
  };

  const triggerValidationError = () => {
    const error = handleValidationError(
      'Email is required',
      {
        component: 'UserForm',
        action: 'validateEmail',
        field: 'email'
      }
    );
    setCurrentError(error);
  };

  const triggerSystemError = () => {
    const error = createError(
      'Database connection failed',
      'system',
      'critical',
      {
        component: 'DatabaseService',
        action: 'connect',
        database: 'lms_db'
      }
    );
    setCurrentError(error);
  };

  const switchLanguage = (locale: 'uk' | 'en') => {
    errorHandler.setLocale(locale);
    // Оновлюємо поточну помилку з новою мовою
    if (currentError) {
      setCurrentError({...currentError});
    }
  };

  const showFullPage = (pageType: string) => {
    setShowPage(pageType);
  };

  if (showPage) {
    switch (showPage) {
      case '404':
        return (
          <div>
            <NotFoundPage />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPage(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Повернутися до прикладів
              </button>
            </div>
          </div>
        );
      case '403':
        return (
          <div>
            <AccessDeniedPage />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPage(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Повернутися до прикладів
              </button>
            </div>
          </div>
        );
      case '500':
        return (
          <div>
            <ServerErrorPage />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPage(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Повернутися до прикладів
              </button>
            </div>
          </div>
        );
      case 'network':
        return (
          <div>
            <NetworkErrorPage />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPage(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Повернутися до прикладів
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Приклади локалізації помилок</h2>
        
        {/* Перемикач мови */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Мова інтерфейсу:</h3>
          <div className="space-x-2">
            <button
              onClick={() => switchLanguage('uk')}
              className={`px-4 py-2 rounded ${
                errorHandler.getLocale() === 'uk' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Українська
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`px-4 py-2 rounded ${
                errorHandler.getLocale() === 'en' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Кнопки для виклику різних помилок */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Типи помилок:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={triggerNetworkError}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Мережева помилка
            </button>
            <button
              onClick={triggerAuthError}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Помилка автентифікації
            </button>
            <button
              onClick={triggerValidationError}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Помилка валідації
            </button>
            <button
              onClick={triggerSystemError}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Системна помилка
            </button>
          </div>
        </div>

        {/* Повні сторінки помилок */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Повні сторінки помилок:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => showFullPage('404')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              404 - Не знайдено
            </button>
            <button
              onClick={() => showFullPage('403')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              403 - Доступ заборонено
            </button>
            <button
              onClick={() => showFullPage('500')}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
            >
              500 - Помилка сервера
            </button>
            <button
              onClick={() => showFullPage('network')}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Мережева проблема
            </button>
          </div>
        </div>

        {/* Відображення поточної помилки */}
        {currentError && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Поточна помилка:</h3>
              <button
                onClick={() => setCurrentError(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <ErrorDisplay
              error={currentError}
              showDetails={true}
              onRetry={() => window.location.reload()}
            />
          </div>
        )}

        {/* Інформація про систему */}
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Інформація про локалізацію:</h3>
          <ul className="text-sm space-y-1">
            <li>• Поточна мова: {errorHandler.getLocale().toUpperCase()}</li>
            <li>• Кількість помилок в історії: {errorHandler.getErrorHistory().length}</li>
            <li>• Підтримуються мови: Українська, English</li>
            <li>• Автоматичне визначення типу помилки за ключовими словами</li>
            <li>• Можливість повідомлення про проблему з деталями</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorLocalizationExamples;
