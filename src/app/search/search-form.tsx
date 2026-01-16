'use client';

import { useState } from 'react';
import { globalSearch, type SearchResult } from '@/app/actions/search';
import Link from 'next/link';

export function SearchForm() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError('Søket må være minst 2 tegn');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await globalSearch(query);
      if ('success' in result && result.success) {
        setResults(result.data);
      } else if ('error' in result) {
        setError(result.error);
      }
    } catch (err) {
      setError('En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      customer: '👥',
      contact: '📞',
      communication: '💬',
      deal: '💼',
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800',
      contact: 'bg-green-100 text-green-800',
      communication: 'bg-purple-100 text-purple-800',
      deal: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white shadow rounded-lg p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk etter kunder, kontakter, kommunikasjon eller deals..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Søker...' : 'Søk'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resultater ({results.length})
          </h2>
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.link}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                        {result.description}
                      </span>
                    </div>
                    {result.metadata && (
                      <p className="text-xs text-gray-500">{result.metadata}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && query.trim().length >= 2 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">Ingen resultater funnet for "{query}"</p>
        </div>
      )}
    </div>
  );
}
