import React, { useMemo, useCallback, useState } from 'react';
import { Student } from '@/types/lms';
import { OptimizedStudentRegistry, ObjectPool } from '@/utils/optimization';
import { debounce, throttle } from '@/utils/optimization/optimizedAlgorithms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface OptimizedStudentListProps {
  students: Student[];
  onStudentSelect?: (student: Student) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  maxItems?: number;
}

// Object pool для зменшення алокації пам'яті
const studentCardPool = new ObjectPool(
  () => ({ id: '', name: '', email: '', level: 'A1' as const, balance: 0 }),
  (obj) => {
    obj.id = '';
    obj.name = '';
    obj.email = '';
    obj.level = 'A1';
    obj.balance = 0;
  }
);

export const OptimizedStudentList: React.FC<OptimizedStudentListProps> = ({
  students,
  onStudentSelect,
  showFilters = true,
  showSearch = true,
  maxItems
}) => {
  // Оптимізований реєстр студентів
  const studentRegistry = useMemo(() => {
    const registry = new OptimizedStudentRegistry();
    students.forEach(student => registry.addStudent(student));
    return registry;
  }, [students]);

  // Стан для фільтрів
  const [filters, setFilters] = useState({
    search: '',
    level: '' as string,
    minBalance: undefined as number | undefined,
    maxBalance: undefined as number | undefined,
    sortBy: 'name' as 'name' | 'email' | 'balance',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Оптимізований пошук з debounce
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setFilters(prev => ({ ...prev, search: query }));
    }, 300),
    []
  );

  // Оптимізована фільтрація
  const filteredStudents = useMemo(() => {
    let result = studentRegistry.searchStudents(filters.search);

    // Додаткові фільтри
    if (filters.level) {
      result = result.filter(student => student.level === filters.level);
    }

    if (filters.minBalance !== undefined) {
      result = result.filter(student => student.balance >= filters.minBalance);
    }

    if (filters.maxBalance !== undefined) {
      result = result.filter(student => student.balance <= filters.maxBalance);
    }

    // Сортування
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Обмеження кількості
    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [studentRegistry, filters, maxItems]);

  // Оптимізовані обробники подій
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSort = useCallback((field: 'name' | 'email' | 'balance') => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Віртуалізація для великих списків
  const visibleStudents = useMemo(() => {
    // Показуємо тільки видимі елементи для великих списків
    if (filteredStudents.length > 100) {
      return filteredStudents.slice(0, 50); // Показуємо перші 50 для початку
    }
    return filteredStudents;
  }, [filteredStudents]);

  // Статистика
  const stats = useMemo(() => {
    const total = students.length;
    const filtered = filteredStudents.length;
    const byLevel = students.reduce((acc, student) => {
      acc[student.level] = (acc[student.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, filtered, byLevel };
  }, [students, filteredStudents]);

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Студенти</h3>
              <p className="text-sm text-muted-foreground">
                Показано {stats.filtered} з {stats.total}
              </p>
            </div>
            <div className="flex gap-2">
              {Object.entries(stats.byLevel).map(([level, count]) => (
                <Badge key={level} variant="secondary">
                  {level}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Пошук та фільтри */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук студентів..."
                    className="pl-10"
                    onChange={handleSearch}
                  />
                </div>
              )}

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">Всі рівні</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>

                  <Input
                    type="number"
                    placeholder="Мін. баланс"
                    value={filters.minBalance || ''}
                    onChange={(e) => handleFilterChange('minBalance', e.target.value ? Number(e.target.value) : undefined)}
                  />

                  <Input
                    type="number"
                    placeholder="Макс. баланс"
                    value={filters.maxBalance || ''}
                    onChange={(e) => handleFilterChange('maxBalance', e.target.value ? Number(e.target.value) : undefined)}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1"
                    >
                      Ім'я
                      {filters.sortBy === 'name' && (
                        filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSort('balance')}
                      className="flex items-center gap-1"
                    >
                      Баланс
                      {filters.sortBy === 'balance' && (
                        filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список студентів */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onSelect={onStudentSelect}
          />
        ))}
      </div>

      {/* Повідомлення про відсутність результатів */}
      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {filters.search ? 'Студенти не знайдені' : 'Немає студентів для відображення'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Повідомлення про обрізання результатів */}
      {filteredStudents.length > visibleStudents.length && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Показано {visibleStudents.length} з {filteredStudents.length} студентів
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                // Тут можна реалізувати завантаження ще студентів
              }}
            >
              Завантажити ще
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Оптимізована картка студента
const StudentCard: React.FC<{
  student: Student;
  onSelect?: (student: Student) => void;
}> = React.memo(({ student, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect?.(student);
  }, [student, onSelect]);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{student.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{student.email}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Badge variant="secondary">{student.level}</Badge>
            <span className="text-sm font-medium">
              ₴{student.balance.toLocaleString()}
            </span>
          </div>
          {student.enrolledGroups && student.enrolledGroups.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Групи: {student.enrolledGroups.length}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StudentCard.displayName = 'StudentCard';
