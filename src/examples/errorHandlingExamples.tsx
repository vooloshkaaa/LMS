import React, { useState } from 'react';
import { 
  errorHandler, 
  createError, 
  handleNetworkError, 
  handleValidationError, 
  handleAuthError,
  useErrorHandler 
} from '../utils/errorHandler';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Приклад 1: Базове використання errorHandler
export const BasicErrorExample: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const triggerError = () => {
    try {
      // Симуляція помилки
      throw new Error('Це тестова помилка');
    } catch (err) {
      const errorDetails = errorHandler.handleError(
        err instanceof Error ? err : new Error('Невідома помилка'),
        'business',
        'medium',
        {
          component: 'BasicErrorExample',
          action: 'triggerError',
          userId: 'user123'
        }
      );
      setError(errorDetails.message);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Базовий приклад обробки помилки</h3>
      <button 
        onClick={triggerError}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Викликати помилку
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

// Приклад 2: Робота з мережевими помилками
export const NetworkErrorExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateApiCall = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Симуляція мережевої помилки
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 1000);
      });
    } catch (err) {
      const errorDetails = handleNetworkError(
        err instanceof Error ? err : new Error('Network error'),
        {
          endpoint: '/api/students',
          method: 'GET',
          userId: 'user123'
        }
      );
      setError(errorDetails.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Приклад мережевої помилки</h3>
      <button 
        onClick={simulateApiCall}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Завантаження...' : 'Simulate API Call'}
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

// Приклад 3: Валідація форми
export const ValidationExample: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (formData: { email: string; password: string }) => {
    const newErrors: string[] = [];

    if (!formData.email.includes('@')) {
      const errorDetails = handleValidationError(
        'Некоректний формат email',
        {
          component: 'ValidationExample',
          action: 'validateEmail',
          field: 'email',
          value: formData.email
        }
      );
      newErrors.push(errorDetails.message);
    }

    if (formData.password.length < 6) {
      const errorDetails = handleValidationError(
        'Пароль повинен містити мінімум 6 символів',
        {
          component: 'ValidationExample',
          action: 'validatePassword',
          field: 'password',
          value: formData.password.length
        }
      );
      newErrors.push(errorDetails.message);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      email: 'invalid-email',
      password: '123'
    };
    validateForm(formData);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Приклад валідації</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input 
          type="email" 
          placeholder="Email"
          className="border p-2 rounded w-full"
          defaultValue="invalid-email"
        />
        <input 
          type="password" 
          placeholder="Password"
          className="border p-2 rounded w-full"
          defaultValue="123"
        />
        <button 
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Валідувати
        </button>
      </form>
      {errors.map((error, index) => (
        <p key={index} className="mt-2 text-red-600 text-sm">{error}</p>
      ))}
    </div>
  );
};

// Приклад 4: Автентифікаційні помилки
export const AuthErrorExample: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const simulateLogin = async () => {
    try {
      // Симуляція помилки входу
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Invalid credentials')), 500);
      });
    } catch (err) {
      const errorDetails = handleAuthError(
        err instanceof Error ? err : new Error('Auth error'),
        true,
        {
          component: 'AuthErrorExample',
          action: 'login',
          email: 'user@example.com'
        }
      );
      setError(errorDetails.message);
    }
  };

  const simulateUnauthorized = () => {
    const errorDetails = handleAuthError(
      new Error('Access denied'),
      false,
      {
        component: 'AuthErrorExample',
        action: 'accessResource',
        resource: '/admin/dashboard',
        userId: 'user123'
      }
    );
    setError(errorDetails.message);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Приклад автентифікаційних помилок</h3>
      <div className="space-x-2">
        <button 
          onClick={simulateLogin}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Simulate Login Error
        </button>
        <button 
          onClick={simulateUnauthorized}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Simulate Access Error
        </button>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

// Приклад 5: Використання хука useErrorHandler
export const HookExample: React.FC = () => {
  const { handleError, getErrorStats, getErrorHistory } = useErrorHandler();
  const [lastError, setLastError] = useState<string | null>(null);

  const triggerCustomError = () => {
    const errorDetails = handleError(
      'Кастомна помилка з хука',
      {
        action: 'customAction',
        customData: 'some value'
      }
    );
    setLastError(errorDetails.message);
  };

  const showStats = () => {
    const stats = getErrorStats();
    const history = getErrorHistory();
    console.log('Error Stats:', stats);
    console.log('Error History:', history);
    alert(`Всього помилок: ${stats.total}`);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Приклад використання хука</h3>
      <div className="space-x-2">
        <button 
          onClick={triggerCustomError}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Trigger Custom Error
        </button>
        <button 
          onClick={showStats}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Show Stats (Console)
        </button>
      </div>
      {lastError && <p className="mt-2 text-red-600">{lastError}</p>}
    </div>
  );
};

// Приклад 6: Error Boundary в дії
export const ErrorBoundaryExample: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Ця помилка буде перехоплена Error Boundary');
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Приклад Error Boundary</h3>
      <p>Цей компонент обгорнутий в Error Boundary</p>
      <button 
        onClick={() => setShouldError(true)}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Викликати помилку компонента
      </button>
    </div>
  );
};

// Головний компонент з усіма прикладами
export const ErrorHandlingExamples: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Приклади обробки помилок</h2>
      
      <BasicErrorExample />
      <NetworkErrorExample />
      <ValidationExample />
      <AuthErrorExample />
      <HookExample />
      
      <ErrorBoundary>
        <ErrorBoundaryExample />
      </ErrorBoundary>
    </div>
  );
};

export default ErrorHandlingExamples;
