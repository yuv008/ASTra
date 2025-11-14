import { Issue, Suggestion, Severity, IssueCategory } from '@astra/shared';
import { AlertCircle, AlertTriangle, Info, Shield, Code, Bug, Zap, Lightbulb } from 'lucide-react';

interface IssuesListProps {
  issues: Issue[];
  suggestions: Suggestion[];
}

function IssuesList({ issues, suggestions }: IssuesListProps) {
  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case Severity.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case Severity.WARNING:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case Severity.INFO:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.SECURITY:
        return <Shield className="h-4 w-4" />;
      case IssueCategory.COMPLEXITY:
        return <Code className="h-4 w-4" />;
      case IssueCategory.BUG:
        return <Bug className="h-4 w-4" />;
      case IssueCategory.PERFORMANCE:
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.ERROR:
        return 'border-red-500 bg-red-900/30';
      case Severity.WARNING:
        return 'border-yellow-500 bg-yellow-900/30';
      case Severity.INFO:
        return 'border-blue-500 bg-blue-900/30';
    }
  };

  if (issues.length === 0 && suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="h-12 w-12 text-green-400 mx-auto mb-3" />
        <p className="text-green-400 font-medium">No issues found!</p>
        <p className="text-gray-400 text-sm mt-1">Your code looks great.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Issues ({issues.length})
          </h3>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`border-l-4 rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getCategoryIcon(issue.category)}
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {issue.category}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{issue.ruleId}</span>
                    </div>
                    <p className="text-white font-medium">{issue.message}</p>

                    {issue.location && (
                      <p className="text-sm text-gray-400 mt-1">
                        Line {issue.location.start.line}:{issue.location.start.column}
                      </p>
                    )}

                    {/* OWASP/CWE Info for Security Issues */}
                    {issue.category === IssueCategory.SECURITY && (issue as any).cwe && (
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                        {(issue as any).cwe && (
                          <span className="bg-gray-700 px-2 py-1 rounded">
                            {(issue as any).cwe}
                          </span>
                        )}
                        {(issue as any).owasp && (
                          <span className="bg-gray-700 px-2 py-1 rounded">
                            {(issue as any).owasp}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Suggestions */}
                    {issue.suggestions && issue.suggestions.length > 0 && (
                      <div className="mt-3 bg-gray-800/50 rounded p-2">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          💡 Suggestions:
                        </p>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {issue.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-blue-400 mr-2">→</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Code Snippet */}
                    {issue.codeSnippet && (
                      <details className="mt-3">
                        <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                          Show code snippet
                        </summary>
                        <pre className="mt-2 bg-gray-900 rounded p-3 overflow-x-auto text-xs text-gray-300">
                          {issue.codeSnippet}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Lightbulb className="h-5 w-5 text-purple-400 mr-2" />
            AI Suggestions ({suggestions.length})
          </h3>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border-l-4 border-purple-500 bg-purple-900/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">{suggestion.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {suggestion.impact} impact
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {suggestion.effort} effort
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-2">{suggestion.description}</p>
                {suggestion.source === 'ai' && (
                  <p className="text-xs text-gray-500">
                    Powered by {(suggestion as any).model || 'AI'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default IssuesList;
