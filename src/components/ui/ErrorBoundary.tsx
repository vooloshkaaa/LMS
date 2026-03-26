import React, { Component, ReactNode } from 'react';
import { errorHandler, ErrorDetails } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: ErrorDetails) => void;
}

interface State {
  hasError: boolean;
  error: ErrorDetails | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = errorHandler.handleError(
      error,
      'ui',
      'high',
      {
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
        reactErrorInfo: errorInfo,
        errorBoundary: true
      }
    );

    this.setState({ error: errorDetails });
    
    if (this.props.onError) {
      this.props.onError(errorDetails);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Щось пішло не так
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Вибачте, сталася помилка. Ми вже працюємо над її вирішенням.
              </p>
              {this.state.error && (
                <p className="text-xs text-gray-500 mt-2">
                  ID помилки: {this.state.error.id}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Перезавантажити сторінку
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Спробувати знову
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  Деталі помилки (для розробників)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Повідомлення:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Категорія:</strong> {this.state.error.category}
                  </div>
                  <div>
                    <strong>Рівень:</strong> {this.state.error.severity}
                  </div>
                  <div>
                    <strong>Час:</strong> {new Date(this.state.error.timestamp).toLocaleString()}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Хук для використання Error Boundary в функціональних компонентах
export const useErrorHandler = () => {
  return {
    handleError: (error: Error | string, context?: any) => {
      return errorHandler.handleError(error, 'ui', 'medium', {
        component: 'CustomHook',
        ...context
      });
    },
    getErrorHistory: () => errorHandler.getErrorHistory(),
    getErrorStats: () => errorHandler.getErrorStats()
  };
};
