import { getSourcesForEntity } from '@/lib/sources/server';
import type { Source } from '@/lib/sources/types';
import styles from './SourcesList.module.css';

interface SourcesListProps {
  entityType: string;
  entitySlug: string;
  title?: string;
}

export async function SourcesList({ 
  entityType, 
  entitySlug, 
  title = "Data Sources & References" 
}: SourcesListProps) {
  const { data: sources, error } = await getSourcesForEntity(entityType, entitySlug);
  
  // Handle errors
  if (error) {
    console.error('[SourcesList] Error fetching sources:', error);
    return (
      <div className={styles.error}>
        <strong>Error loading sources:</strong> {error}
      </div>
    );
  }
  
  if (sources.length === 0) return null;
  
  // Group by relevance
  const primarySources = sources.filter(s => s.relevance === 'primary');
  const secondarySources = sources.filter(s => s.relevance === 'secondary');
  const referenceSources = sources.filter(s => s.relevance === 'reference');
  
  return (
    <div className={styles.sourcesSection}>
      <h3 className={styles.title}>{title}</h3>
      
      {primarySources.length > 0 && (
        <SourceGroup 
          title="Primary Sources" 
          sources={primarySources} 
          variant="primary"
        />
      )}
      
      {secondarySources.length > 0 && (
        <SourceGroup 
          title="Additional Sources" 
          sources={secondarySources} 
          variant="secondary"
        />
      )}
      
      {referenceSources.length > 0 && (
        <SourceGroup 
          title="References" 
          sources={referenceSources} 
          variant="reference"
        />
      )}
    </div>
  );
}

function SourceGroup({ title, sources, variant }: {
  title: string;
  sources: Source[];
  variant: 'primary' | 'secondary' | 'reference';
}) {
  return (
    <div className={styles.sourceGroup}>
      <h4 className={styles.groupTitle}>{title}</h4>
      <ul className={`${styles.sourceList} ${styles[variant]}`}>
        {sources.map((source) => (
          <li key={source.source_id} className={styles.sourceItem}>
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${styles.sourceLink} ${styles[variant]}`}
            >
              {source.title}
              <span className={styles.externalIcon}>↗</span>
            </a>
            {source.description && variant === 'primary' && (
              <p className={styles.description}>{source.description}</p>
            )}
            {variant === 'primary' && (
              <p className={styles.domain}>{source.domain}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
