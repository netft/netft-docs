import type {CliManifest} from '../../types/reference';
import styles from './reference.module.css';

export function Command({
  manifest,
  commandId,
}: {
  manifest: CliManifest;
  commandId: string;
}) {
  const command = manifest.commands.find((item) => item.id === commandId);
  if (!command) throw new Error(`unknown CLI command: ${commandId}`);
  const options = command.optionIds.map((id) => {
    const option = manifest.options.find((item) => item.id === id);
    if (!option) throw new Error(`unknown CLI option: ${id}`);
    return option;
  });
  return (
    <article className={styles.apiType}>
      <div className={styles.metadata}>
        <a href={manifest.sourceUrl}>
          {manifest.component} {manifest.version}
        </a>
      </div>
      <h2>Synopsis</h2>
      <pre className={styles.signature}>
        <code>{command.synopsis}</code>
      </pre>
      <p>{command.description}</p>
      <h2>Options</h2>
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id}>
                <td data-label="Option">
                  <code>
                    {option.shortName ? `-${option.shortName}, ` : ''}--
                    {option.longName}
                  </code>
                </td>
                <td data-label="Value">
                  <code>{option.valueType}</code>
                </td>
                <td data-label="Description">{option.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Exit status</h2>
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {command.exitStatuses.map((code) => {
              const status = manifest.exitStatuses.find(
                (item) => item.code === code,
              );
              return (
                <tr key={code}>
                  <td data-label="Code">
                    <code>{code}</code>
                  </td>
                  <td data-label="Meaning">{status?.meaning}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>Examples</h2>
      <pre className={styles.signature}>
        <code>{command.examples.join('\n')}</code>
      </pre>
    </article>
  );
}
