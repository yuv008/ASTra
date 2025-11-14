import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import { AlertCircle } from 'lucide-react';

function App() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-blue-500">AST</span>ra
                </h1>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">
                  Local-First Code Analysis Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                <span className="w-2 h-2 mr-2 bg-green-400 rounded-full animate-pulse"></span>
                Backend Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <Dashboard onError={setError} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-400">
            Built with ❤️ for developers who value privacy and code quality
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
