import { getPageSourceRows } from "@/lib/pageRefresh/pageSources";
import { safeSourceUrl, sourceLabel } from "@/lib/pageRefresh/format";
import type { EntityType } from "@/lib/pageRefresh/entities";
import styles from "./SourcesList.module.css";

interface Props {
  entityType: EntityType;
  entityKey: string;
  title?: string;
  /** Wrap in <section className="inner-section"> (only rendered when there are sources). */
  asSection?: boolean;
}

/**
 * Footer list of the vault documents a page's data was refreshed from.
 * Documents with a public link are clickable; documents without one are shown
 * by name only. Links are resolved live from the vault, so adding a public
 * link to a document updates every page that cites it.
 */
export default async function PageSources({ entityType, entityKey, title = "Sources for this page", asSection = false }: Props) {
  const rows = await getPageSourceRows(entityType, entityKey);
  if (rows.length === 0) return null;

  const list = (
    <div className={styles.sourcesSection} id="page-sources">
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.sourceList}>
        {rows.map((row) => {
          const label = sourceLabel(row);
          const url = safeSourceUrl(row.source_url);
          return (
            <li key={row.document_id} className={styles.sourceItem}>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                  {label}
                  <span className={styles.externalIcon} aria-hidden="true">↗</span>
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return asSection ? <section className="inner-section">{list}</section> : list;
}
