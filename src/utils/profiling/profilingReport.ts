// Звіти результатів профілювання
export interface ProfilingReport {
  timestamp: string;
  environment: 'development' | 'production';
  duration: number;
  hotspots: Hotspot[];
  metrics: PerformanceMetrics;
  recommendations: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface Hotspot {
  type: 'cpu' | 'memory' | 'database' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  name: string;
  value: number;
  unit: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface PerformanceMetrics {
  cpu: {
    totalTime: number;
    averageFunctionTime: number;
    bottleneckCount: number;
    topFunctions: Array<{
      name: string;
      time: number;
      percentage: number;
    }>;
  };
  memory: {
    baseline: number;
    peak: number;
    growth: number;
    leakCount: number;
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueryCount: number;
    errorRate: number;
    topTables: Array<{
      name: string;
      queryCount: number;
      avgTime: number;
    }>;
  };
  application: {
    renderTime: number;
    bundleSize: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

// Клас для генерації звітів
export class ProfilingReportGenerator {
  // Генерація звіту на основі результатів профілювання
  static generateReport(results: any): ProfilingReport {
    const hotspots = this.identifyHotspots(results);
    const metrics = this.extractMetrics(results);
    const recommendations = this.generateRecommendations(hotspots, metrics);
    const grade = this.calculateGrade(metrics, hotspots);
    
    return {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.DEV ? 'development' : 'production',
      duration: performance.now(),
      hotspots,
      metrics,
      recommendations,
      grade
    };
  }
  
  // Визначення гарячих точок
  private static identifyHotspots(results: any): Hotspot[] {
    const hotspots: Hotspot[] = [];
    
    // CPU hotspots
    if (results.cpu?.functions) {
      results.cpu.functions.slice(0, 3).forEach((func: any, index: number) => {
        hotspots.push({
          type: 'cpu',
          severity: func.percentage > 40 ? 'critical' : func.percentage > 25 ? 'high' : func.percentage > 15 ? 'medium' : 'low',
          name: func.name,
          value: func.totalTime,
          unit: 'ms',
          description: `Function ${func.name} takes ${func.totalTime.toFixed(2)}ms (${func.percentage.toFixed(1)}% of total CPU time)`,
          impact: `Affects overall application responsiveness`,
          recommendation: this.getCPURecommendation(func)
        });
      });
    }
    
    // Memory hotspots
    if (results.memory?.analysis) {
      const memoryGrowth = results.memory.analysis.growth;
      if (memoryGrowth > 50 * 1024 * 1024) { // > 50MB
        hotspots.push({
          type: 'memory',
          severity: 'critical',
          name: 'High Memory Growth',
          value: memoryGrowth / 1024 / 1024,
          unit: 'MB',
          description: `Memory usage increased by ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB during profiling`,
          impact: 'May cause performance degradation and potential crashes',
          recommendation: 'Check for memory leaks, optimize object creation, implement object pooling'
        });
      }
      
      const leaks = results.memory.leaks || [];
      if (leaks.length > 0) {
        hotspots.push({
          type: 'memory',
          severity: 'high',
          name: 'Memory Leaks Detected',
          value: leaks.length,
          unit: 'leaks',
          description: `${leaks.length} potential memory leaks detected`,
          impact: 'Progressive memory degradation over time',
          recommendation: 'Review event listeners, timers, and circular references'
        });
      }
    }
    
    // Database hotspots
    if (results.database?.summary) {
      const slowQueries = results.database.summary.slowQueries || [];
      if (slowQueries.length > 0) {
        const slowest = slowQueries[0];
        hotspots.push({
          type: 'database',
          severity: slowest.duration > 2000 ? 'critical' : slowest.duration > 1000 ? 'high' : 'medium',
          name: 'Slow Database Query',
          value: slowest.duration,
          unit: 'ms',
          description: `Query "${slowest.query}" takes ${slowest.duration.toFixed(2)}ms`,
          impact: 'Affects data loading and user experience',
          recommendation: 'Add database indexes, optimize query structure, implement caching'
        });
      }
      
      const errorRate = results.database.summary.errorQueries?.length || 0;
      if (errorRate > 0) {
        hotspots.push({
          type: 'database',
          severity: 'high',
          name: 'Database Query Errors',
          value: errorRate,
          unit: 'errors',
          description: `${errorRate} database queries failed`,
          impact: 'Data integrity and application stability issues',
          recommendation: 'Review query syntax, check database constraints, implement error handling'
        });
      }
    }
    
    return hotspots.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  // Витягнення метрик
  private static extractMetrics(results: any): PerformanceMetrics {
    return {
      cpu: {
        totalTime: results.cpu?.duration || 0,
        averageFunctionTime: results.cpu?.summary?.averageDuration || 0,
        bottleneckCount: results.cpu?.summary?.bottlenecks?.length || 0,
        topFunctions: (results.cpu?.functions || []).slice(0, 5).map((func: any) => ({
          name: func.name,
          time: func.totalTime,
          percentage: func.percentage
        }))
      },
      memory: {
        baseline: results.memory?.baseline?.heapUsed || 0,
        peak: results.memory?.analysis?.current?.heapUsed || 0,
        growth: results.memory?.analysis?.growth || 0,
        leakCount: results.memory?.leaks?.length || 0,
        trend: results.memory?.analysis?.trend || 'stable'
      },
      database: {
        totalQueries: results.database?.summary?.totalQueries || 0,
        averageQueryTime: results.database?.summary?.averageDuration || 0,
        slowQueryCount: results.database?.summary?.slowQueries?.length || 0,
        errorRate: ((results.database?.summary?.errorQueries?.length || 0) / Math.max(results.database?.summary?.totalQueries || 1)) * 100,
        topTables: (results.database?.summary?.topTables || []).slice(0, 5).map((table: any) => ({
          name: table.tableName,
          queryCount: table.queryCount,
          avgTime: table.averageDuration
        }))
      },
      application: {
        renderTime: results.performance?.results?.find((r: any) => r.testName.includes('render'))?.duration || 0,
        bundleSize: 0, // Would need actual bundle analysis
        firstContentfulPaint: 0, // Would need Web Vitals
        largestContentfulPaint: 0 // Would need Web Vitals
      }
    };
  }
  
  // Генерація рекомендацій
  private static generateRecommendations(hotspots: Hotspot[], metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    // CPU рекомендації
    if (metrics.cpu.bottleneckCount > 0) {
      recommendations.push('🔧 Optimize CPU-intensive functions by implementing caching, memoization, or algorithm improvements');
    }
    
    if (metrics.cpu.averageFunctionTime > 100) {
      recommendations.push('⚡ Consider breaking down large functions into smaller, more efficient ones');
    }
    
    // Memory рекомендації
    if (metrics.memory.growth > 20 * 1024 * 1024) {
      recommendations.push('🧠 Implement memory management strategies: object pooling, weak references, or lazy loading');
    }
    
    if (metrics.memory.leakCount > 0) {
      recommendations.push('🚨 Fix memory leaks by properly cleaning up event listeners, timers, and circular references');
    }
    
    if (metrics.memory.trend === 'increasing') {
      recommendations.push('📈 Monitor memory usage trends and implement periodic cleanup routines');
    }
    
    // Database рекомендації
    if (metrics.database.slowQueryCount > 0) {
      recommendations.push('🗄️ Optimize database queries: add indexes, rewrite complex queries, implement query result caching');
    }
    
    if (metrics.database.errorRate > 5) {
      recommendations.push('❌ Improve database error handling and query validation to reduce failure rate');
    }
    
    if (metrics.database.averageQueryTime > 500) {
      recommendations.push('⏱️ Consider database connection pooling and query optimization techniques');
    }
    
    // Загальні рекомендації
    const criticalHotspots = hotspots.filter(h => h.severity === 'critical');
    if (criticalHotspots.length > 0) {
      recommendations.push('🚨 Address critical performance issues immediately as they significantly impact user experience');
    }
    
    if (hotspots.length > 5) {
      recommendations.push('📊 Consider implementing performance monitoring and alerting for early detection of issues');
    }
    
    return recommendations;
  }
  
  // Розрахунок оцінки продуктивності
  private static calculateGrade(metrics: PerformanceMetrics, hotspots: Hotspot[]): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100;
    
    // CPU оцінка
    if (metrics.cpu.bottleneckCount > 3) score -= 20;
    else if (metrics.cpu.bottleneckCount > 1) score -= 10;
    
    if (metrics.cpu.averageFunctionTime > 200) score -= 15;
    else if (metrics.cpu.averageFunctionTime > 100) score -= 5;
    
    // Memory оцінка
    if (metrics.memory.growth > 50 * 1024 * 1024) score -= 25;
    else if (metrics.memory.growth > 20 * 1024 * 1024) score -= 10;
    
    if (metrics.memory.leakCount > 2) score -= 20;
    else if (metrics.memory.leakCount > 0) score -= 5;
    
    // Database оцінка
    if (metrics.database.slowQueryCount > 3) score -= 20;
    else if (metrics.database.slowQueryCount > 1) score -= 10;
    
    if (metrics.database.errorRate > 10) score -= 25;
    else if (metrics.database.errorRate > 5) score -= 10;
    
    if (metrics.database.averageQueryTime > 1000) score -= 15;
    else if (metrics.database.averageQueryTime > 500) score -= 5;
    
    // Hotspots оцінка
    const criticalCount = hotspots.filter(h => h.severity === 'critical').length;
    const highCount = hotspots.filter(h => h.severity === 'high').length;
    
    if (criticalCount > 2) score -= 30;
    else if (criticalCount > 0) score -= 15;
    
    if (highCount > 3) score -= 20;
    else if (highCount > 1) score -= 10;
    
    // Визначення grade
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  // Отримання рекомендації для CPU функції
  private static getCPURecommendation(func: any): string {
    if (func.name.includes('array') || func.name.includes('processing')) {
      return 'Consider using more efficient algorithms, web workers, or chunking large datasets';
    }
    if (func.name.includes('string') || func.name.includes('regex')) {
      return 'Optimize string operations, cache regex patterns, or use more efficient string methods';
    }
    if (func.name.includes('dom') || func.name.includes('render')) {
      return 'Implement virtualization, reduce DOM manipulations, or use React.memo/useMemo';
    }
    return 'Profile this function specifically and consider algorithmic improvements or caching';
  }
  
  // Експорт звіту в різних форматах
  static exportReport(report: ProfilingReport, format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'html':
        return this.generateHTMLReport(report);
      
      case 'markdown':
        return this.generateMarkdownReport(report);
      
      default:
        return JSON.stringify(report, null, 2);
    }
  }
  
  // Генерація HTML звіту
  private static generateHTMLReport(report: ProfilingReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>LMS Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .grade-${report.grade} { 
            font-size: 48px; font-weight: bold; 
            color: ${report.grade === 'A' ? '#4CAF50' : report.grade === 'B' ? '#2196F3' : report.grade === 'C' ? '#FF9800' : report.grade === 'D' ? '#FF5722' : '#F44336'};
        }
        .hotspot { margin: 10px 0; padding: 15px; border-left: 4px solid #ccc; }
        .critical { border-left-color: #F44336; background: #ffebee; }
        .high { border-left-color: #FF5722; background: #fff3e0; }
        .medium { border-left-color: #FF9800; background: #fff8e1; }
        .low { border-left-color: #4CAF50; background: #e8f5e8; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: #f9f9f9; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LMS Performance Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Environment: ${report.environment}</p>
        <div class="grade-${report.grade}">Grade: ${report.grade}</div>
    </div>
    
    <h2>🔥 Performance Hotspots</h2>
    ${report.hotspots.map(hotspot => `
        <div class="hotspot ${hotspot.severity}">
            <h3>${hotspot.name}</h3>
            <p><strong>Type:</strong> ${hotspot.type} | <strong>Severity:</strong> ${hotspot.severity}</p>
            <p><strong>Value:</strong> ${hotspot.value} ${hotspot.unit}</p>
            <p>${hotspot.description}</p>
            <p><strong>Impact:</strong> ${hotspot.impact}</p>
            <p><strong>Recommendation:</strong> ${hotspot.recommendation}</p>
        </div>
    `).join('')}
    
    <h2>📊 Performance Metrics</h2>
    <div class="metrics">
        <div class="metric-card">
            <h3>CPU Performance</h3>
            <p>Total Time: ${report.metrics.cpu.totalTime.toFixed(2)}ms</p>
            <p>Avg Function Time: ${report.metrics.cpu.averageFunctionTime.toFixed(2)}ms</p>
            <p>Bottlenecks: ${report.metrics.cpu.bottleneckCount}</p>
        </div>
        <div class="metric-card">
            <h3>Memory Usage</h3>
            <p>Growth: ${(report.metrics.memory.growth / 1024 / 1024).toFixed(2)}MB</p>
            <p>Leaks: ${report.metrics.memory.leakCount}</p>
            <p>Trend: ${report.metrics.memory.trend}</p>
        </div>
        <div class="metric-card">
            <h3>Database Performance</h3>
            <p>Total Queries: ${report.metrics.database.totalQueries}</p>
            <p>Avg Query Time: ${report.metrics.database.averageQueryTime.toFixed(2)}ms</p>
            <p>Slow Queries: ${report.metrics.database.slowQueryCount}</p>
        </div>
    </div>
    
    <h2>💡 Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>`;
  }
  
  // Генерація Markdown звіту
  private static generateMarkdownReport(report: ProfilingReport): string {
    return `
# LMS Performance Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Environment:** ${report.environment}  
**Grade:** ${report.grade}

## 🔥 Performance Hotspots

${report.hotspots.map(hotspot => `
### ${hotspot.name} (${hotspot.severity})

- **Type:** ${hotspot.type}
- **Value:** ${hotspot.value} ${hotspot.unit}
- **Description:** ${hotspot.description}
- **Impact:** ${hotspot.impact}
- **Recommendation:** ${hotspot.recommendation}
`).join('\n')}

## 📊 Performance Metrics

### CPU Performance
- **Total Time:** ${report.metrics.cpu.totalTime.toFixed(2)}ms
- **Average Function Time:** ${report.metrics.cpu.averageFunctionTime.toFixed(2)}ms
- **Bottlenecks:** ${report.metrics.cpu.bottleneckCount}

### Memory Usage
- **Growth:** ${(report.metrics.memory.growth / 1024 / 1024).toFixed(2)}MB
- **Leaks:** ${report.metrics.memory.leakCount}
- **Trend:** ${report.metrics.memory.trend}

### Database Performance
- **Total Queries:** ${report.metrics.database.totalQueries}
- **Average Query Time:** ${report.metrics.database.averageQueryTime.toFixed(2)}ms
- **Slow Queries:** ${report.metrics.database.slowQueryCount}

## 💡 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
  }
}

// Експорт за замовчуванням
export default ProfilingReportGenerator;
