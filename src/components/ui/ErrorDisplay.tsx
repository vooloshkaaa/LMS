import React, { useState } from 'react';
import { ErrorDetails } from '../../utils/errorHandler';
import { errorLocalization, LocalizedErrorContent } from '../../utils/localization/errorLocalization';

interface ErrorDisplayProps {
  error: ErrorDetails | string;
  customMessage?: string;
  showDetails?: boolean;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Компонент для відображення помилок користувачу
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  customMessage,
  showDetails = false,
  className = '',
  onRetry,
  onDismiss
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Перетворення помилки в ErrorDetails
  const errorDetails: ErrorDetails = typeof error === 'string' 
    ? {
        id: `ERR_${Date.now()}`,
        message: error,
        category: 'system',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    : error;

  // Отримання локалізованого контенту
  const localizedContent: LocalizedErrorContent = errorLocalization.getLocalizedError(
    errorDetails,
    customMessage
  );

  const handleAction = (action: () => void) => {
    action();
    if (onRetry && action.name === 'reload') {
      onRetry();
    }
  };

  const handleReportProblem = () => {
    setShowReportForm(true);
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      {/* Заголовок помилки */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {localizedContent.title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{localizedContent.message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Дії для користувача */}
      <div className="mt-4 flex flex-wrap gap-2">
        {localizedContent.actions.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.action)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Інструкції для користувача */}
      {localizedContent.needHelp && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Що сталося?
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <p>{localizedContent.whatHappened}</p>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-medium text-blue-800">
                  Що робити?
                </h4>
                <div className="mt-1 text-sm text-blue-700">
                  <p>{localizedContent.whatToDo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Технічні деталі */}
      {(showDetails || showTechnicalDetails) && (
        <div className="mt-4">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg
              className={`h-4 w-4 mr-1 transform transition-transform ${showTechnicalDetails ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Технічні деталі
          </button>
          
          {showTechnicalDetails && (
            <div className="mt-2 bg-gray-100 border border-gray-200 rounded-md p-3">
              <div className="text-xs font-mono space-y-1">
                <div><strong>ID помилки:</strong> {errorDetails.id}</div>
                <div><strong>Категорія:</strong> {errorDetails.category}</div>
                <div><strong>Рівень:</strong> {errorDetails.severity}</div>
                <div><strong>Час:</strong> {new Date(errorDetails.timestamp).toLocaleString()}</div>
                {errorDetails.stack && (
                  <div>
                    <strong>Stack trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {errorDetails.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Форма повідомлення про проблему */}
      {showReportForm && (
        <ErrorReportForm
          error={errorDetails}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
};

// Компонент форми повідомлення про проблему
interface ErrorReportFormProps {
  error: ErrorDetails;
  onClose: () => void;
}

const ErrorReportForm: React.FC<ErrorReportFormProps> = ({ error, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supportMessages = errorLocalization.getSupportMessages();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Симуляція відправки форми
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Тут була б реальна відправка на сервер
      console.log('Error report submitted:', {
        ...formData,
        errorId: error.id,
        errorDetails: error
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit error report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              {supportMessages.form.success}
            </h3>
            <button
              onClick={onClose}
              className="mt-2 text-sm text-green-600 hover:text-green-800"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {supportMessages.title}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {supportMessages.description}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {supportMessages.form.name}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {supportMessages.form.email}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {supportMessages.form.subject}
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={`Проблема з помилкою ${error.id}`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {supportMessages.form.message}
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Опишіть, що сталося і як ви до цього дійшли..."
            required
          />
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>ID помилки:</strong> {error.id}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Надсилання...' : supportMessages.form.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ErrorDisplay;
