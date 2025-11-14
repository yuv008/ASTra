import { useState } from 'react';
import { api } from '../services/api';
import { FileAnalysisResult, AnalysisResult } from '@astra/shared';
import AnalysisForm from '../components/AnalysisForm';
import MetricsCard from '../components/MetricsCard';
import IssuesList from '../components/IssuesList';
import { Activity, AlertTriangle, CheckCircle, Code } from 'lucide-react';

interface DashboardProps {
  onError: (error: string) => void;
}

function Dashboard({ onError }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FileAnalysisResult | AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<'file' | 'project'>('file');

  const handleAnalyze = async (path: string, enableAI: boolean) => {
    setLoading(true);
    setResult(null);
    onError('');

    try {
      let analysisResult;

      if (analysisType === 'file') {
        analysisResult = await api.analyzeFile({
          filePath: path,
          enableAI,
        });
      } else {
        analysisResult = await api.analyzeProject({
          projectPath: path,
          enableAI,
        });
      }

      setResult(analysisResult);
    } catch (error: any) {
      onError(error.response?.data?.message || error.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getMetricsData = () => {
    if (!result) return null;

    // Check if it's a project analysis (has 'files' array and 'projectPath')
    if ('projectPath' in result && 'files' in result) {
      // Project analysis
      const projectResult = result as AnalysisResult;
      return {
        maintainability: projectResult.metrics.quality.maintainabilityIndex,
        complexity: projectResult.metrics.code.averageComplexity,
        grade: projectResult.metrics.grade.letter,
        totalIssues: projectResult.issues.length,
        files: projectResult.files.length,
      };
    } else {
      // File analysis
      const fileResult = result as FileAnalysisResult;
      return {
        maintainability: fileResult.metrics.maintainability,
        complexity: fileResult.metrics.complexity,
        grade: fileResult.metrics.maintainability >= 80 ? 'A' :
               fileResult.metrics.maintainability >= 60 ? 'B' :
               fileResult.metrics.maintainability >= 40 ? 'C' : 'D',
        totalIssues: fileResult.issues.length,
        files: 1,
      };
    }
  };

  const metrics = getMetricsData();
  const issues = result?.issues || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Analysis Form */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Code Analysis</h2>
        <AnalysisForm
          onAnalyze={handleAnalyze}
          loading={loading}
          analysisType={analysisType}
          onAnalysisTypeChange={setAnalysisType}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300">Analyzing code...</p>
        </div>
      )}

      {/* Results */}
      {!loading && metrics && (
        <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Maintainability"
              value={`${Math.round(metrics.maintainability)}`}
              subtitle={`Grade: ${metrics.grade}`}
              icon={<Activity className="h-6 w-6" />}
              color={metrics.maintainability >= 60 ? 'green' : metrics.maintainability >= 40 ? 'yellow' : 'red'}
            />
            <MetricsCard
              title="Complexity"
              value={metrics.complexity.toFixed(1)}
              subtitle="Average"
              icon={<Code className="h-6 w-6" />}
              color={metrics.complexity < 10 ? 'green' : metrics.complexity < 15 ? 'yellow' : 'red'}
            />
            <MetricsCard
              title="Issues Found"
              value={metrics.totalIssues.toString()}
              subtitle={`${issues.filter(i => i.severity === 'error').length} critical`}
              icon={<AlertTriangle className="h-6 w-6" />}
              color={metrics.totalIssues === 0 ? 'green' : metrics.totalIssues < 5 ? 'yellow' : 'red'}
            />
            <MetricsCard
              title="Files Analyzed"
              value={metrics.files.toString()}
              subtitle="Total"
              icon={<CheckCircle className="h-6 w-6" />}
              color="blue"
            />
          </div>

          {/* Issues List */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Issues & Suggestions
            </h2>
            <IssuesList issues={issues} suggestions={result?.suggestions || []} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <Code className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            Ready to Analyze
          </h3>
          <p className="text-gray-400">
            Enter a file path or project directory above to start the analysis
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
