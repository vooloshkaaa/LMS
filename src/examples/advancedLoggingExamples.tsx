import React, { useState, useEffect } from 'react';
import { 
  loggerManager, 
  logContextManager, 
  useLogContext, 
  ContextUtils,
  LogLevel,
  type LogContext 
} from '../utils/logger';

// Приклад 1: Базове використання розширеного логування
export const BasicAdvancedLoggingExample: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const logMessages = async () => {
    await loggerManager.debug('Debug message with context', { 
      component: 'BasicExample',
      action: 'debugLog' 
    });
    
    await loggerManager.info('Info message', { 
      component: 'BasicExample',
      action: 'infoLog' 
    });
    
    await loggerManager.warn('Warning message', { 
      component: 'BasicExample',
      action: 'warnLog' 
    });
    
    await loggerManager.error('Error message', { 
      component: 'BasicExample',
      action: 'errorLog' 
    }, new Error('Sample error'));

    // Оновлюємо список логів
    updateLogsList();
  };

  const updateLogsList = () => {
    const fileHandler = loggerManager.getHandlers().find(h => h.name === 'file');
    if (fileHandler && 'getLogs' in fileHandler) {
      const logs = (fileHandler as any).getLogs();
      setLogs(logs.slice(-10)); // Показуємо останні 10 логів
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Розширене логування</h3>
      <button 
        onClick={logMessages}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Логувати повідомлення
      </button>
      <button 
        onClick={updateLogsList}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Оновити список логів
      </button>
      
      <div className="mt-4">
        <h4 className="font-semibold">Останні логи:</h4>
        <div className="bg-gray-100 p-2 rounded mt-2 max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-xs font-mono mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Приклад 2: Робота з контекстом
export const ContextExample: React.FC = () => {
  const { 
    setGlobalContext, 
    pushContext, 
    popContext, 
    createSessionContext,
    createComponentContext 
  } = useLogContext();

  const setupContext = () => {
    // Встановлення глобального контексту
    setGlobalContext({
      userId: 'user123',
      sessionId: 'sess456'
    });

    logContextManager.pushContext({
      component: 'ContextExample',
      action: 'setupContext'
    });

    loggerManager.info('Контекст налаштовано');
  };

  const nestedOperation = async () => {
    pushContext({
      action: 'nestedOperation',
      step: 1
    });

    await loggerManager.info('Вкладена операція 1');

    pushContext({
      step: 2
    });

    await loggerManager.info('Вкладена операція 2');

    popContext();
    popContext();
  };

  const clearContext = () => {
    logContextManager.clearContext();
    loggerManager.info('Контекст очищено');
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Контекст логування</h3>
      <div className="space-x-2">
        <button 
          onClick={setupContext}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Налаштувати контекст
        </button>
        <button 
          onClick={nestedOperation}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Вкладена операція
        </button>
        <button 
          onClick={clearContext}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Очистити контекст
        </button>
      </div>
    </div>
  );
};

// Приклад 3: Логування HTTP запитів
export const HttpLoggingExample: React.FC = () => {
  const simulateApiCall = async () => {
    const requestId = await loggerManager.logRequest(
      'GET',
      '/api/students',
      { 'authorization': 'Bearer token123' },
      { page: 1, limit: 10 }
    );

    // Симуляція затримки
    await new Promise(resolve => setTimeout(resolve, 1000));

    await loggerManager.logResponse(
      requestId,
      200,
      1000,
      { students: [], total: 0 }
    );
  };

  const simulateApiError = async () => {
    const requestId = await loggerManager.logRequest(
      'POST',
      '/api/students',
      { 'authorization': 'Bearer token123' },
      { name: 'John', email: 'john@example.com' }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    await loggerManager.logResponse(
      requestId,
      400,
      500,
      { error: 'Validation failed' }
    );
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">HTTP логування</h3>
      <div className="space-x-2">
        <button 
          onClick={simulateApiCall}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Симулювати успішний запит
        </button>
        <button 
          onClick={simulateApiError}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Симулювати помилку запиту
        </button>
      </div>
    </div>
  );
};

// Приклад 4: Логування операцій з вимірюванням часу
export const OperationLoggingExample: React.FC = () => {
  const quickOperation = async () => {
    await loggerManager.logOperation('Quick Operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'Quick result';
    }, { component: 'OperationExample' });
  };

  const slowOperation = async () => {
    await loggerManager.logOperation('Slow Operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'Slow result';
    }, { component: 'OperationExample' });
  };

  const failingOperation = async () => {
    try {
      await loggerManager.logOperation('Failing Operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        throw new Error('Operation failed');
      }, { component: 'OperationExample' });
    } catch (error) {
      // Помилка вже залогована
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Логування операцій</h3>
      <div className="space-x-2">
        <button 
          onClick={quickOperation}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Швидка операція
        </button>
        <button 
          onClick={slowOperation}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
        Повільна операція
        </button>
        <button 
          onClick={failingOperation}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
        Операція з помилкою
        </button>
      </div>
    </div>
  );
};

// Приклад 5: Статистика логування
export const LoggingStatsExample: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  const showStats = () => {
    const loggingStats = loggerManager.getStats();
    setStats(loggingStats);
  };

  const exportConfig = () => {
    const config = {
      handlersCount: loggerManager.getHandlers().length,
      globalMinLevel: stats?.globalMinLevel,
      handlers: loggerManager.getHandlers().map(h => ({
        name: h.name,
        minLevel: h.minLevel,
        format: h.format
      }))
    };
    
    console.log('Logging Configuration:', JSON.stringify(config, null, 2));
    alert('Конфігурація виведена в консоль');
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Статистика логування</h3>
      <div className="space-x-2">
        <button 
          onClick={showStats}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Показати статистику
        </button>
        <button 
          onClick={exportConfig}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
        Експортувати конфігурацію
        </button>
      </div>
      
      {stats && (
        <div className="mt-4 bg-gray-100 p-3 rounded">
          <h4 className="font-semibold">Поточна статистика:</h4>
          <div className="text-sm mt-2">
            <div>Кількість обробників: {stats.handlersCount}</div>
            <div>Глобальний рівень: {LogLevel[stats.globalMinLevel]}</div>
            <div>Статус: {stats.isEnabled ? 'Увімкнено' : 'Вимкнено'}</div>
            <div className="mt-2">
              <strong>Обробники:</strong>
              <ul className="ml-4">
                {stats.handlers.map((handler: any, index: number) => (
                  <li key={index}>
                    {handler.name} - {LogLevel[handler.minLevel]} - {handler.format}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Головний компонент з усіма прикладами
export const AdvancedLoggingExamples: React.FC = () => {
  useEffect(() => {
    // Налаштування початкового контексту при монтуванні
    logContextManager.setGlobalContext({
      component: 'AdvancedLoggingExamples',
      sessionId: ContextUtils.generateSessionId()
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Приклади розширеного логування</h2>
      
      <BasicAdvancedLoggingExample />
      <ContextExample />
      <HttpLoggingExample />
      <OperationLoggingExample />
      <LoggingStatsExample />
      
      <div className="p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Поради щодо використання:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Використовуйте URL параметри для debugging: ?debug=true&logLevel=debug</li>
          <li>Перевіряйте localStorage для перегляду файлових логів</li>
          <li>Контекст автоматично додається до всіх логів</li>
          <li>Ротація логів працює автоматично в браузері через localStorage</li>
          <li>В production режимі логи відправляються на віддалений сервіс</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedLoggingExamples;
