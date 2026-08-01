import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const commandNames = [
  'info',
  'check',
  'monitor',
  'record',
  'bias',
  'completion',
];

const exitMeanings = new Map([
  [0, 'Completed successfully'],
  [2, 'Invalid command line or configuration'],
  [3, 'Sensor discovery failed'],
  [4, 'Stream connection or acquisition failed'],
  [5, 'Sensor reported a fault'],
  [6, 'Input/output operation failed'],
  [7, 'A check acceptance criterion failed'],
  [8, 'Recording integrity could not be guaranteed'],
  [130, 'Interrupted'],
]);

export function parseCliHelp(id, output) {
  const lines = output.split(/\r?\n/);
  const synopsis = lines.find((line) => line.startsWith('Usage: '))?.slice(7);
  if (!synopsis) throw new Error(`missing CLI synopsis for ${id}`);
  const sections = new Map();
  let section = 'description';
  sections.set(section, []);
  for (const line of lines.slice(1)) {
    const heading = line.match(/^(Options|Examples|Exit status):$/)?.[1];
    if (heading) {
      section = heading;
      sections.set(section, []);
      continue;
    }
    sections.get(section).push(line);
  }
  const options = [];
  const optionLines = sections.get('Options') ?? [];
  for (let index = 0; index < optionLines.length; ++index) {
    const match = optionLines[index].match(
      /^\s*(?:-([A-Za-z]),\s*)?--([a-z-]+)(?:\s+(.+))?$/,
    );
    if (!match) continue;
    const description = optionLines[index + 1]?.trim() ?? '';
    options.push({
      id: match[2],
      longName: match[2],
      ...(match[1] ? {shortName: match[1]} : {}),
      valueType: match[3] ?? 'flag',
      values: match[3]?.includes('|') ? match[3].split('|') : [],
      description,
    });
  }
  const exitLine = (sections.get('Exit status') ?? []).join(' ');
  const exitStatuses = [...exitLine.matchAll(/\d+/g)].map((match) =>
    Number(match[0]),
  );
  const examples = (sections.get('Examples') ?? [])
    .map((line) => line.trim())
    .filter(Boolean);
  const description = (sections.get('description') ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  return {
    id,
    name: id,
    synopsis,
    description,
    optionIds: options.map((option) => option.id),
    options,
    positionals: [],
    examples,
    exitStatuses,
  };
}

export function extractCli(root, metadata) {
  const executable = [
    join(root, 'build/netft'),
    join(root, 'build/release/netft'),
  ].find(existsSync);
  if (!executable) {
    throw new Error(
      'netft-cli executable not found; build the stable checkout before extraction',
    );
  }
  const commands = commandNames.map((name) => {
    const result = spawnSync(executable, ['help', name], {encoding: 'utf8'});
    if (result.status !== 0)
      throw new Error(`failed to read netft help ${name}: ${result.stderr}`);
    return parseCliHelp(name, result.stdout);
  });
  const options = new Map();
  for (const command of commands) {
    for (const option of command.options) options.set(option.id, option);
    delete command.options;
  }
  const codes = [
    ...new Set(commands.flatMap((command) => command.exitStatuses)),
  ].sort((a, b) => a - b);
  return {
    schemaVersion: 1,
    kind: 'cli',
    component: 'netft-cli',
    ...metadata,
    options: [...options.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    commands,
    exitStatuses: codes.map((code) => ({
      code,
      meaning: exitMeanings.get(code) ?? 'Undocumented',
    })),
  };
}
