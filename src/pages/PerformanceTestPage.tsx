import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { performanceTestRunner, PerformanceReport } from '@/utils/performance/performanceTests';
import { loadTestRunner, LoadTestResult, LOAD_TEST_CONFIGS } from '@/utils/performance/loadTestRunner';
import { usePerformanceMonitor, useMemoryMonitor, useApiPerformance, useWebVitals } from '@/utils/performance/benchmarkHooks';
import { Play, Square, Download, AlertTriangle, CheckCircle, Clock, Cpu, MemoryStick, Activity } from 'lucide-react';

const PerformanceTestPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testResults, setTestResults] = useState<PerformanceReport | null>(null);
  const [loadTestResults, setLoadTestResults] = useState<LoadTestResult[]>([]);
  const [error, setError] = useState<string>('');
  
  // Моніторинг продуктивності сторінки
  const pageMetrics = usePerformanceMonitor('PerformanceTestPage');
  const memoryMetrics = useMemoryMonitor(2000);
  const apiMetrics = useApiPerformance();
  const webVitals = useWebVitals();

  useEffect(() => {
    // Завантаження попередніх результатів
    const savedResults = localStorage.getItem('performanceTestResults');
    if (savedResults) {
      setTestResults(JSON.parse(savedResults));
    }

    const savedLoadResults = localStorage.getItem('loadTestResults');
    if (savedLoadResults) {
      setLoadTestResults(JSON.parse(savedLoadResults));
    }
  }, []);

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setCurrentTest('Performance Tests');
    setError('');
    
    try {
      const results = await performanceTestRunner.runAllTests();
      setTestResults(results);
      localStorage.setItem('performanceTestResults', JSON.stringify(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runLoadTest = async (configName: keyof typeof LOAD_TEST_CONFIGS) => {
    setIsRunning(true);
    setCurrentTest(`Load Test: ${configName}`);
    setError('');
    
    try {
      const config = LOAD_TEST_CONFIGS[configName];
      const result = await loadTestRunner.runLoadTest(config);
      setLoadTestResults(prev => [...prev, result]);
      localStorage.setItem('loadTestResults', JSON.stringify([...loadTestResults, result]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performanceTests: testResults,
      loadTests: loadTestResults,
      realTimeMetrics: {
        page: pageMetrics,
        memory: memoryMetrics.stats,
        api: apiMetrics.apiMetrics,
        webVitals: webVitals.vitals
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setTestResults(null);
    setLoadTestResults([]);
    localStorage.removeItem('performanceTestResults');
    localStorage.removeItem('loadTestResults');
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'bg-green-500' };
    if (score >= 80) return { grade: 'B', color: 'bg-blue-500' };
    if (score >= 70) return { grade: 'C', color: 'bg-yellow-500' };
    if (score >= 60) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Testing</h1>
          <p className="text-muted-foreground">Monitor and test LMS application performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportResults} variant="outline" disabled={!testResults && loadTestResults.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
          <Button onClick={clearResults} variant="outline" disabled={!testResults && loadTestResults.length === 0}>
            Clear Results
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isRunning && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Running: {currentTest}...
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Tests</TabsTrigger>
          <TabsTrigger value="load">Load Tests</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Web Vitals Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{webVitals.score}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${webVitals.isGood ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {webVitals.isGood ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(memoryMetrics.currentMemory / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${
                    memoryMetrics.stats.trend === 'increasing' ? 'bg-red-500' :
                    memoryMetrics.stats.trend === 'decreasing' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {memoryMetrics.stats.trend}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Renders</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pageMetrics.renderCount}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Avg: {pageMetrics.averageRenderTime.toFixed(2)}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(apiMetrics.apiMetrics).reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Total tracked calls
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Run performance and load tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={runPerformanceTests} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run Performance Tests
                </Button>
                
                <Button 
                  onClick={() => runLoadTest('LIGHT_LOAD')} 
                  disabled={isRunning}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Light Load Test
                </Button>
                
                <Button 
                  onClick={() => runLoadTest('MEDIUM_LOAD')} 
                  disabled={isRunning}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Medium Load Test
                </Button>
                
                <Button 
                  onClick={() => runLoadTest('HEAVY_LOAD')} 
                  disabled={isRunning}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Heavy Load Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {testResults ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Performance Test Results
                    <Badge variant={testResults.summary.passedTests === testResults.summary.totalTests ? 'default' : 'destructive'}>
                      {testResults.summary.passedTests}/{testResults.summary.totalTests} Passed
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Completed at {new Date(testResults.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{testResults.summary.averageDuration.toFixed(2)}ms</div>
                      <div className="text-sm text-muted-foreground">Average Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(testResults.summary.totalMemoryUsed / 1024 / 1024).toFixed(1)}MB</div>
                      <div className="text-sm text-muted-foreground">Memory Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{testResults.summary.successRate}</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {testResults.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{result.testName}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.duration.toFixed(2)}ms
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            Memory: {((result.memoryAfter - result.memoryBefore) / 1024).toFixed(1)}KB
                          </div>
                          {result.metrics && (
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(result.metrics).map(([key, value]) => (
                                <div key={key}>{key}: {JSON.stringify(value)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No performance test results available</p>
                  <p className="text-sm text-muted-foreground">Run performance tests to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="load" className="space-y-6">
          {loadTestResults.length > 0 ? (
            <div className="space-y-6">
              {loadTestResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.testName}
                      <Badge variant={result.failedRequests === 0 ? 'default' : 'destructive'}>
                        {((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}% Success
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(result.startTime).toLocaleString()} - {new Date(result.endTime).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold">{result.totalRequests}</div>
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{result.requestsPerSecond.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Requests/Second</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{result.averageResponseTime.toFixed(2)}ms</div>
                        <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{result.p95ResponseTime.toFixed(2)}ms</div>
                        <div className="text-sm text-muted-foreground">95th Percentile</div>
                      </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {result.errors.slice(0, 5).map((error, errorIndex) => (
                            <div key={errorIndex} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                          {result.errors.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              ... and {result.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No load test results available</p>
                  <p className="text-sm text-muted-foreground">Run load tests to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage History</CardTitle>
                <CardDescription>Last 100 measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current: {(memoryMetrics.currentMemory / 1024 / 1024).toFixed(1)} MB</span>
                    <span>Trend: {memoryMetrics.stats.trend}</span>
                  </div>
                  <Progress 
                    value={(memoryMetrics.currentMemory / (1024 * 1024 * 100)) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    Min: {(memoryMetrics.stats.min / 1024 / 1024).toFixed(1)} MB | 
                    Max: {(memoryMetrics.stats.max / 1024 / 1024).toFixed(1)} MB | 
                    Avg: {(memoryMetrics.stats.average / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>Tracked API calls</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(apiMetrics.apiMetrics).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(apiMetrics.apiMetrics).map(([name, metrics]) => (
                      <div key={name} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-muted-foreground">
                            {metrics.count} calls
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{metrics.averageTime.toFixed(2)}ms</div>
                          <div className="text-xs text-muted-foreground">
                            avg time
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No API calls tracked yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Web Vitals</CardTitle>
              <CardDescription>Core Web Vitals metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{webVitals.vitals.FCP.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">FCP</div>
                  <Progress value={Math.min((webVitals.vitals.FCP / 1800) * 100, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{webVitals.vitals.LCP.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">LCP</div>
                  <Progress value={Math.min((webVitals.vitals.LCP / 2500) * 100, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{webVitals.vitals.CLS.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">CLS</div>
                  <Progress value={Math.min((webVitals.vitals.CLS / 0.1) * 100, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{webVitals.vitals.FID.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">FID</div>
                  <Progress value={Math.min((webVitals.vitals.FID / 100) * 100, 100)} className="h-1 mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{webVitals.vitals.TTFB.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">TTFB</div>
                  <Progress value={Math.min((webVitals.vitals.TTFB / 800) * 100, 100)} className="h-1 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Overall performance assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${getPerformanceGrade(webVitals.score).color} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                      {getPerformanceGrade(webVitals.score).grade}
                    </div>
                    <div className="font-medium">Web Vitals Score</div>
                    <div className="text-sm text-muted-foreground">{webVitals.score}/100</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${pageMetrics.averageRenderTime < 16 ? 'bg-green-500' : pageMetrics.averageRenderTime < 50 ? 'bg-yellow-500' : 'bg-red-500'} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                      {pageMetrics.averageRenderTime < 16 ? 'A' : pageMetrics.averageRenderTime < 50 ? 'B' : 'C'}
                    </div>
                    <div className="font-medium">Render Performance</div>
                    <div className="text-sm text-muted-foreground">{pageMetrics.averageRenderTime.toFixed(2)}ms avg</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${memoryMetrics.stats.trend === 'stable' ? 'bg-green-500' : memoryMetrics.stats.trend === 'increasing' ? 'bg-red-500' : 'bg-yellow-500'} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                      {memoryMetrics.stats.trend === 'stable' ? 'A' : memoryMetrics.stats.trend === 'increasing' ? 'C' : 'B'}
                    </div>
                    <div className="font-medium">Memory Stability</div>
                    <div className="text-sm text-muted-foreground">{memoryMetrics.stats.trend}</div>
                  </div>
                </div>
                
                {testResults && (
                  <div>
                    <h4 className="font-medium mb-4">Test Results Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium">Performance Tests</div>
                        <div className="text-2xl font-bold mt-2">{testResults.summary.successRate}</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium">Average Duration</div>
                        <div className="text-2xl font-bold mt-2">{testResults.summary.averageDuration.toFixed(2)}ms</div>
                        <div className="text-sm text-muted-foreground">Across all tests</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {loadTestResults.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Load Test Summary</h4>
                    <div className="space-y-2">
                      {loadTestResults.map((result, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{result.testName}</div>
                              <div className="text-sm text-muted-foreground">
                                {result.totalRequests} requests in {result.duration}s
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{result.requestsPerSecond.toFixed(1)} req/s</div>
                              <div className="text-sm text-muted-foreground">
                                {result.averageResponseTime.toFixed(2)}ms avg
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceTestPage;
