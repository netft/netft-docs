import {ecosystem, officialSources} from '../../data/documentation';
import type {ReactNode} from 'react';

export function ComponentVersions(): ReactNode {
  const offerings = ecosystem.categories.flatMap(
    (category) => category.offerings,
  );
  return (
    <table>
      <thead>
        <tr>
          <th>Interface</th>
          <th>Stable version</th>
          <th>Platforms</th>
          <th>Release</th>
        </tr>
      </thead>
      <tbody>
        {offerings.map((offering) => (
          <tr key={offering.id}>
            <td>{offering.name}</td>
            <td>{offering.stableVersion}</td>
            <td>{offering.platforms.join(', ')}</td>
            <td>
              <a href={`${offering.repository}/releases`}>Releases</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OfficialSources(): ReactNode {
  return (
    <ul>
      {officialSources.map((source) => (
        <li key={source.id}>
          <a href={source.url}>{source.title}</a> — {source.publisher},{' '}
          {source.documentNumber}; accessed {source.accessed}.
        </li>
      ))}
    </ul>
  );
}
