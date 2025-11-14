import { useState } from 'react';
import { Folder, FileCode, Sparkles } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (path: string, enableAI: boolean) => void;
  loading: boolean;
  analysisType: 'file' | 'project';
  onAnalysisTypeChange: (type: 'file' | 'project') => void;
}

function AnalysisForm({ onAnalyze, loading, analysisType, onAnalysisTypeChange }: AnalysisFormProps) {
  const [path, setPath] = useState('');
  const [enableAI, setEnableAI] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onAnalyze(path.trim(), enableAI);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Analysis Type Toggle */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => onAnalysisTypeChange('file')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            analysisType === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FileCode className="h-4 w-4 mr-2" />
          Single File
        </button>
        <button
          type="button"
          onClick={() => onAnalysisTypeChange('project')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            analysisType === 'project'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Folder className="h-4 w-4 mr-2" />
          Project Directory
        </button>
      </div>

      {/* Path Input */}
      <div>
        <label htmlFor="path" className="block text-sm font-medium text-gray-300 mb-2">
          {analysisType === 'file' ? 'File Path' : 'Project Path'}
        </label>
        <input
          type="text"
          id="path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder={analysisType === 'file' ? '/path/to/file.js' : '/path/to/project'}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      {/* AI Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="enableAI"
          checked={enableAI}
          onChange={(e) => setEnableAI(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          disabled={loading}
        />
        <label htmlFor="enableAI" className="flex items-center text-sm text-gray-300">
          <Sparkles className="h-4 w-4 mr-1 text-purple-400" />
          Enable AI Suggestions (requires Ollama)
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !path.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze Code'}
      </button>
    </form>
  );
}

export default AnalysisForm;
