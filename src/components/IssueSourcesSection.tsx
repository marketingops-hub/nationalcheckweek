import { getPageSourceRows } from "@/lib/pageRefresh/pageSources";
import { mergeSources, type NumberedSource } from "@/lib/pageRefresh/mergeSources";
import type { EntityType } from "@/lib/pageRefresh/entities";

interface Props {
  /** The issue's own numbered references; the [n] citations in the text point at these. */
  numbered: NumberedSource[];
  /** Older plain-text sources, shown only when there are no numbered references. */
  legacy: string[];
  /** Pages whose vault sources should be listed too. */
  vault: { entityType: EntityType; entityKey: string }[];
  /** Shown when there are no sources at all. Leave out to hide the section instead. */
  emptyMessage?: string;
}

/**
 * One "Sources & References" list for an issue page: the numbered references
 * first, then the vault documents the page was refreshed from. A document that
 * is in both lists appears once.
 */
export default async function IssueSourcesSection({ numbered, legacy, vault, emptyMessage }: Props) {
  const rows = (await Promise.all(vault.map((v) => getPageSourceRows(v.entityType, v.entityKey)))).flat();
  const merged = mergeSources(numbered, rows);
  const lastNum = merged.numbered.reduce((max, n) => Math.max(max, n.num), 0);

  const hasAny = merged.numbered.length > 0 || merged.extras.length > 0 || legacy.length > 0;
  if (!hasAny && !emptyMessage) return null;

  return (
    <section id="sources" className="inner-section">
      <h2 className="section-heading section-heading--tight">Sources &amp; References</h2>

      {(merged.numbered.length > 0 || merged.extras.length > 0) && (
        <div className="section-heading--md">
          {merged.numbered.map((src) => (
            <div key={src.id} id={`source-${src.num}`} className="source-item">
              <span className={`source-num ${src.verified ? "source-num--verified" : ""}`}>{src.num}</span>
              <div>
                <div className="source-title">
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
                  ) : (
                    src.title
                  )}
                  {src.verified && <span className="source-verified">VERIFIED</span>}
                </div>
                <div className="source-meta">
                  {src.publisher}{src.publisher && src.year && " · "}{src.year}
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer">↗ View source</a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {merged.extras.map((src, i) => {
            const num = lastNum + i + 1;
            return (
              <div key={src.id} id={`source-${num}`} className="source-item">
                <span className="source-num">{num}</span>
                <div>
                  <div className="source-title">
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a>
                    ) : (
                      src.label
                    )}
                  </div>
                  {src.url && (
                    <div className="source-meta">
                      <a href={src.url} target="_blank" rel="noopener noreferrer">↗ View source</a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {merged.numbered.length === 0 && legacy.length > 0 && (
        <div>
          {legacy.map((s) => (
            <div key={s} className="source-legacy">📄 {s}</div>
          ))}
        </div>
      )}

      {!hasAny && emptyMessage && <p className="source-empty">{emptyMessage}</p>}
    </section>
  );
}
