import type {ApiManifest, ApiSymbol} from '../../types/reference';
import styles from './reference.module.css';

export function ReferenceHeader({
  manifest,
  symbol,
}: {
  manifest: ApiManifest;
  symbol: ApiSymbol;
}) {
  const location =
    symbol.importPath ??
    `#include <${symbol.sourcePath.replace('include/', '')}>`;
  return (
    <div className={styles.metadata}>
      <code>{location}</code>
      <span aria-hidden="true">·</span>
      <a href={`${manifest.sourceUrl}/${symbol.sourcePath}`}>
        {manifest.component} {manifest.version}
      </a>
    </div>
  );
}
