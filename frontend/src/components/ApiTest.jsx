import React, { useState } from 'react';

const ApiTest = () => {
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const testProcess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/process/a62b882f-179e-4e95-987b-7daca4d15df9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setResults(`Process: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResults(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/results/a62b882f-179e-4e95-987b-7daca4d15df9');
      const data = await response.json();
      setResults(`Results: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResults(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">API Test</h3>
      <div className="space-y-2">
        <button
          onClick={testProcess}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Process
        </button>
        <button
          onClick={testResults}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Test Results
        </button>
      </div>
      {loading && <div className="mt-4 text-gray-600">Loading...</div>}
      {results && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {results}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
