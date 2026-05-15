import { getAreaSources, getStateSources } from '@/lib/sources';

export default async function TestSourcesPage() {
  // Test Melbourne
  const melbourneSources = await getAreaSources('melbourne');
  
  // Test Victoria
  const victoriaSources = await getStateSources('victoria');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Source System Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Melbourne Sources ({melbourneSources.length})</h2>
        {melbourneSources.length === 0 ? (
          <p className="text-gray-500">No sources found</p>
        ) : (
          <ul className="space-y-2">
            {melbourneSources.map((source) => (
              <li key={source.source_id} className="border p-4 rounded">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-bold"
                >
                  {source.title}
                </a>
                <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Relevance: {source.relevance} | Domain: {source.domain}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Victoria Sources ({victoriaSources.length})</h2>
        {victoriaSources.length === 0 ? (
          <p className="text-gray-500">No sources found</p>
        ) : (
          <ul className="space-y-2">
            {victoriaSources.map((source) => (
              <li key={source.source_id} className="border p-4 rounded">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-bold"
                >
                  {source.title}
                </a>
                <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Relevance: {source.relevance} | Domain: {source.domain}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
