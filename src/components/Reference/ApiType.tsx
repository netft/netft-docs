import type {ApiManifest, ApiSymbol} from '../../types/reference';
import {ReferenceHeader} from './ReferenceHeader';
import styles from './reference.module.css';

function Fields({symbol}: {symbol: ApiSymbol}) {
  if (symbol.fields.length === 0) return null;
  return (
    <section>
      <h3>Fields</h3>
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Default</th>
              <th>Mutability</th>
            </tr>
          </thead>
          <tbody>
            {symbol.fields.map((field) => (
              <tr key={field.name}>
                <td data-label="Name">
                  <code>{field.name}</code>
                </td>
                <td data-label="Type">
                  <code>{field.type}</code>
                </td>
                <td data-label="Default">
                  {field.default === undefined ? (
                    'Required'
                  ) : (
                    <code>{field.default}</code>
                  )}
                </td>
                <td data-label="Mutability">
                  {field.mutable === false ? 'Read-only' : 'Mutable'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Methods({symbol}: {symbol: ApiSymbol}) {
  if (symbol.methods.length === 0) return null;
  return (
    <section>
      <h3>Member functions</h3>
      {symbol.methods.map((method) => (
        <section className={styles.member} key={method.id}>
          <h4 id={method.id}>
            <code>{method.name}</code>
          </h4>
          <pre className={styles.signature}>
            <code>{method.signature};</code>
          </pre>
          {method.parameters.length > 0 && (
            <div className={styles.tableScroll}>
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {method.parameters.map((parameter) => (
                    <tr key={parameter.name}>
                      <td data-label="Parameter">
                        <code>{parameter.name}</code>
                      </td>
                      <td data-label="Type">
                        <code>{parameter.type}</code>
                      </td>
                      <td data-label="Default">
                        {parameter.default === undefined ? (
                          'Required'
                        ) : (
                          <code>{parameter.default}</code>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {method.returnType && (
            <p>
              <strong>Returns:</strong> <code>{method.returnType}</code>
            </p>
          )}
          {method.qualifiers.length > 0 && (
            <p>
              <strong>Qualifiers:</strong>{' '}
              {method.qualifiers.map((value) => (
                <code key={value}>{value}</code>
              ))}
            </p>
          )}
        </section>
      ))}
    </section>
  );
}

function Values({symbol}: {symbol: ApiSymbol}) {
  if (symbol.values.length === 0) return null;
  return (
    <section>
      <h3>Values</h3>
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {symbol.values.map((value) => (
              <tr key={value.name}>
                <td data-label="Name">
                  <code>{value.name}</code>
                </td>
                <td data-label="Value">
                  {value.value === undefined ? (
                    'Implementation-defined'
                  ) : (
                    <code>{String(value.value)}</code>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ApiType({
  manifest,
  symbolId,
}: {
  manifest: ApiManifest;
  symbolId: string;
}) {
  const symbol = manifest.symbols.find((item) => item.id === symbolId);
  if (!symbol) throw new Error(`unknown API symbol: ${symbolId}`);
  return (
    <article className={styles.apiType}>
      <h2>
        <code>{symbol.qualifiedName}</code>
      </h2>
      <ReferenceHeader manifest={manifest} symbol={symbol} />
      <pre className={styles.signature}>
        <code>{symbol.declaration};</code>
      </pre>
      {symbol.bases.length > 0 && (
        <p>
          <strong>Base classes:</strong>{' '}
          {symbol.bases.map((base) => (
            <code key={base}>{base}</code>
          ))}
        </p>
      )}
      <Fields symbol={symbol} />
      <Methods symbol={symbol} />
      <Values symbol={symbol} />
    </article>
  );
}
