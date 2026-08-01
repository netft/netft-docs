import type {RosManifest, RosParameter} from '../../types/reference';
import styles from './reference.module.css';

function Parameters({items}: {items: RosParameter[]}) {
  return (
    <div className={styles.tableScroll}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name}>
              <td data-label="Name">
                <code>{item.name}</code>
              </td>
              <td data-label="Type">
                <code>{item.type}</code>
              </td>
              <td data-label="Default">
                <code>{String(item.default)}</code>
              </td>
              <td data-label="Description">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RosInterface({
  manifest,
  section,
}: {
  manifest: RosManifest;
  section: 'standalone' | 'hardware' | 'diagnostics';
}) {
  const parameters =
    section === 'standalone'
      ? manifest.standaloneParameters
      : section === 'hardware'
        ? manifest.hardwareParameters
        : [];
  const categories =
    section === 'standalone'
      ? new Set(['topic', 'service'])
      : section === 'hardware'
        ? new Set(['state', 'service'])
        : new Set(['diagnostic']);
  const interfaces = manifest.interfaces.filter((item) =>
    categories.has(item.category),
  );
  return (
    <article className={styles.apiType}>
      <div className={styles.metadata}>
        <a href={manifest.sourceUrl}>
          {manifest.component} {manifest.version}
        </a>
      </div>
      {section === 'hardware' && (
        <p>
          <strong>Plugin class:</strong> <code>{manifest.pluginClass}</code>
        </p>
      )}
      {parameters.length > 0 && (
        <>
          <h2>Parameters</h2>
          <Parameters items={parameters} />
        </>
      )}
      <h2>Interfaces</h2>
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {interfaces.map((item) => (
              <tr key={item.id}>
                <td data-label="Name">
                  <code>{item.name}</code>
                </td>
                <td data-label="Category">{item.category}</td>
                <td data-label="Type">
                  <code>{item.type}</code>
                </td>
                <td data-label="Description">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
