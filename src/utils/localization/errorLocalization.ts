import { ErrorDetails } from '../errorHandler';

export type SupportedLocale = 'uk' | 'en';
export type ErrorCategory = 'network' | 'authentication' | 'validation' | 'authorization' | 'business' | 'system' | 'ui';

export interface ErrorMessages {
  title: string;
  message: string;
  actions: string[];
  category: ErrorCategory;
}

export interface LocalizedErrorContent {
  title: string;
  message: string;
  actions: Array<{
    key: string;
    label: string;
    action: () => void;
  }>;
  whatHappened: string;
  whatToDo: string;
  needHelp: boolean;
}

// Клас для локалізації помилок
export class ErrorLocalization {
  private static instance: ErrorLocalization;
  private currentLocale: SupportedLocale = 'uk';
  private messages: Record<SupportedLocale, any> = {} as Record<SupportedLocale, any>;

  private constructor() {
    this.loadMessages();
  }

  public static getInstance(): ErrorLocalization {
    if (!ErrorLocalization.instance) {
      ErrorLocalization.instance = new ErrorLocalization();
    }
    return ErrorLocalization.instance;
  }

  // Завантаження повідомлень з файлів
  private async loadMessages(): Promise<void> {
    try {
      // В реальному додатку тут був би динамічний імпорт
      const ukMessages = await import('../../locales/errorMessages/uk.json');
      const enMessages = await import('../../locales/errorMessages/en.json');
      
      this.messages.uk = ukMessages.default;
      this.messages.en = enMessages.default;
    } catch (error) {
      console.error('Failed to load error messages:', error);
      // Fallback повідомлення
      this.messages = {
        uk: this.getFallbackMessages('uk'),
        en: this.getFallbackMessages('en')
      };
    }
  }

  // Fallback повідомлення на випадок помилки завантаження
  private getFallbackMessages(locale: SupportedLocale): any {
    const isUk = locale === 'uk';
    return {
      errors: {
        network: {
          title: isUk ? 'Проблема з мережею' : 'Network Problem',
          messages: {
            connection_failed: isUk ? 'Помилка підключення' : 'Connection failed'
          },
          actions: {
            retry: isUk ? 'Спробувати знову' : 'Try Again'
          }
        },
        system: {
          title: isUk ? 'Системна помилка' : 'System Error',
          messages: {
            internal_error: isUk ? 'Внутрішня помилка' : 'Internal error'
          },
          actions: {
            retry: isUk ? 'Спробувати знову' : 'Try Again'
          }
        }
      },
      common: {
        error_occurred: isUk ? 'Сталася помилка' : 'An error occurred',
        error_id: isUk ? 'ID помилки' : 'Error ID',
        try_again: isUk ? 'Спробувати знову' : 'Try Again',
        report_problem: isUk ? 'Повідомити про проблему' : 'Report problem'
      }
    };
  }

  // Встановлення поточної мови
  public setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
  }

  // Отримання поточної мови
  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  // Отримання локалізованого повідомлення про помилку
  public getLocalizedError(
    errorDetails: ErrorDetails,
    customMessage?: string
  ): LocalizedErrorContent {
    const locale = this.messages[this.currentLocale];
    const categoryMessages = locale.errors[errorDetails.category];
    
    if (!categoryMessages) {
      return this.getGenericError(errorDetails);
    }

    // Вибір повідомлення на основі контексту або стандартного
    let messageKey = this.getMessageKey(errorDetails);
    let message = customMessage || categoryMessages.messages[messageKey] || 
                 categoryMessages.messages.internal_error || 
                 locale.common.error_occurred;

    // Формування дій
    const actions = this.getActions(categoryMessages.actions, errorDetails);

    return {
      title: categoryMessages.title,
      message,
      actions,
      whatHappened: this.getWhatHappened(errorDetails),
      whatToDo: this.getWhatToDo(errorDetails),
      needHelp: true
    };
  }

  // Визначення ключа повідомлення на основі помилки
  private getMessageKey(errorDetails: ErrorDetails): string {
    const message = errorDetails.message.toLowerCase();
    const context = errorDetails.context || {};

    // Аналіз повідомлення для визначення типу помилки
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection')) return 'connection_failed';
    if (message.includes('credentials')) return 'invalid_credentials';
    if (message.includes('session')) return 'session_expired';
    if (message.includes('required')) return 'required_field';
    if (message.includes('email')) return 'invalid_email';
    if (message.includes('password')) return 'password_too_short';
    if (message.includes('permission')) return 'insufficient_permissions';
    if (message.includes('not found')) return 'resource_not_found';
    if (message.includes('quota')) return 'quota_exceeded';

    return 'internal_error';
  }

  // Формування дій для користувача
  private getActions(
    availableActions: Record<string, string>,
    errorDetails: ErrorDetails
  ): Array<{ key: string; label: string; action: () => void }> {
    const locale = this.messages[this.currentLocale];
    const actions: Array<{ key: string; label: string; action: () => void }> = [];

    // Стандартні дії
    if (availableActions.retry) {
      actions.push({
        key: 'retry',
        label: availableActions.retry,
        action: () => window.location.reload()
      });
    }

    if (availableActions.refresh) {
      actions.push({
        key: 'refresh',
        label: availableActions.refresh,
        action: () => window.location.reload()
      });
    }

    if (availableActions.go_home) {
      actions.push({
        key: 'go_home',
        label: availableActions.go_home,
        action: () => window.location.href = '/'
      });
    }

    // Дія повідомлення про проблему
    actions.push({
      key: 'report_problem',
      label: locale.common.report_problem,
      action: () => this.openReportDialog(errorDetails)
    });

    return actions;
  }

  // Опис того, що сталося
  private getWhatHappened(errorDetails: ErrorDetails): string {
    const locale = this.messages[this.currentLocale];
    
    switch (errorDetails.category) {
      case 'network':
        return locale.errors.network.messages.connection_failed;
      case 'authentication':
        return locale.errors.authentication.messages.invalid_credentials;
      case 'validation':
        return locale.errors.validation.messages.required_field;
      case 'authorization':
        return locale.errors.authorization.messages.access_denied;
      case 'business':
        return locale.errors.business.messages.operation_failed;
      case 'system':
        return locale.errors.system.messages.internal_error;
      case 'ui':
        return locale.errors.ui.messages.component_failed;
      default:
        return locale.common.error_occurred;
    }
  }

  // Інструкції для користувача
  private getWhatToDo(errorDetails: ErrorDetails): string {
    const locale = this.messages[this.currentLocale];
    
    switch (errorDetails.category) {
      case 'network':
        return 'Перевірте ваше інтернет-з\'єднання та спробуйте знову.';
      case 'authentication':
        return 'Перевірте ваші логін та пароль. Якщо проблема не зникає, зв\'яжіться з адміністратором.';
      case 'validation':
        return 'Перевірте правильність заповнення всіх полів та спробуйте знову.';
      case 'authorization':
        return 'Зверніться до адміністратора для отримання необхідних прав доступу.';
      case 'business':
        return 'Спробуйте виконати операцію знову через кілька хвилин.';
      case 'system':
        return 'Ми вже працюємо над вирішенням проблеми. Спробуйте знову пізніше.';
      case 'ui':
        return 'Оновіть сторінку. Якщо проблема не зникає, повідомте нас про неї.';
      default:
        return 'Спробуйте оновити сторінку або зв\'яжіться з підтримкою.';
    }
  }

  // Універсальна помилка
  private getGenericError(errorDetails: ErrorDetails): LocalizedErrorContent {
    const locale = this.messages[this.currentLocale];
    
    return {
      title: locale.common.error_occurred,
      message: errorDetails.message,
      actions: [
        {
          key: 'retry',
          label: locale.common.try_again,
          action: () => window.location.reload()
        },
        {
          key: 'report_problem',
          label: locale.common.report_problem,
          action: () => this.openReportDialog(errorDetails)
        }
      ],
      whatHappened: errorDetails.message,
      whatToDo: 'Спробуйте оновити сторінку або зв\'яжіться з підтримкою.',
      needHelp: true
    };
  }

  // Відкриття діалогу повідомлення про проблему
  private openReportDialog(errorDetails: ErrorDetails): void {
    // Тут буде виклик модального вікна для повідомлення про проблему
    console.log('Opening report dialog for error:', errorDetails);
    
    // Подія для відкриття модального вікна
    window.dispatchEvent(new CustomEvent('openErrorReport', { 
      detail: { error: errorDetails } 
    }));
  }

  // Отримання повідомлень для форми підтримки
  public getSupportMessages(): any {
    return this.messages[this.currentLocale].support;
  }

  // Отримання загальних повідомлень
  public getCommonMessages(): any {
    return this.messages[this.currentLocale].common;
  }
}

// Експорт singleton екземпляру
export const errorLocalization = ErrorLocalization.getInstance();
