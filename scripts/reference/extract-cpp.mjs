import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

function clean(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function parametersFrom(signature) {
  const match = signature.match(/\((.*)\)/);
  if (!match || match[1].trim() === '') return [];
  return match[1].split(',').map((value, index) => {
    const normalized = clean(value);
    const parts = normalized.match(/^(.*?)([A-Za-z_]\w*)(?:\s*=\s*(.*))?$/);
    return parts
      ? {
          name: parts[2],
          type: clean(parts[1]),
          ...(parts[3] ? {default: clean(parts[3])} : {}),
        }
      : {name: `argument${index + 1}`, type: normalized};
  });
}

function methodFrom(declaration) {
  const withoutComments = declaration.replace(/\/\/[^\n]*/g, ' ');
  const signature = clean(withoutComments);
  if (signature.startsWith('using ')) return null;
  const beforeParen = signature.slice(0, signature.indexOf('(')).trim();
  const name = beforeParen.match(/(?:operator=|~?[A-Za-z_]\w*)$/)?.[0];
  if (!name || signature.includes('= delete')) return null;
  const returnType = clean(
    beforeParen
      .slice(0, -name.length)
      .replace(/^explicit\s+/, '')
      .replace(/^\[\[nodiscard\]\]\s*/, ''),
  );
  return {
    id: name.startsWith('~') ? 'destructor' : name,
    name,
    signature,
    returnType,
    parameters: parametersFrom(signature),
    qualifiers: [
      signature.includes(' const') ? 'const' : '',
      signature.includes('noexcept') ? 'noexcept' : '',
    ].filter(Boolean),
    throws: [],
  };
}

function fieldsFrom(body) {
  const fields = [];
  for (const raw of body.split(';')) {
    const declaration = clean(raw);
    if (
      !declaration ||
      declaration.includes('(') ||
      declaration.startsWith('using ')
    )
      continue;
    const declarators = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index < declaration.length; ++index) {
      if ('<{[('.includes(declaration[index])) ++depth;
      else if ('>}] )'.replace(' ', '').includes(declaration[index])) --depth;
      else if (declaration[index] === ',' && depth === 0) {
        declarators.push(declaration.slice(start, index).trim());
        start = index + 1;
      }
    }
    declarators.push(declaration.slice(start).trim());
    const first = declarators
      .shift()
      ?.match(/^(.*?)\s+([A-Za-z_]\w*)(?:\{(.*)\})?$/);
    if (!first) continue;
    const type = clean(first[1]);
    for (const [name, defaultValue] of [
      [first[2], first[3]],
      ...declarators.map((item) => {
        const match = item.match(/^([A-Za-z_]\w*)(?:\{(.*)\})?$/);
        return match ? [match[1], match[2]] : [];
      }),
    ]) {
      if (!name) continue;
      fields.push({
        name,
        type,
        ...(defaultValue !== undefined ? {default: clean(defaultValue)} : {}),
        mutable: true,
      });
    }
  }
  return fields;
}

export function extractCpp(root, metadata) {
  const directory = join(root, 'include/netft');
  const symbols = [];
  for (const filename of readdirSync(directory)
    .filter((name) => name.endsWith('.hpp'))
    .sort()) {
    if (filename === 'export.hpp') continue;
    const sourcePath = `include/netft/${filename}`;
    const source = readFileSync(join(directory, filename), 'utf8');

    for (const match of source.matchAll(
      /enum class\s+(\w+)\s*\{([\s\S]*?)\};/g,
    )) {
      symbols.push({
        id: `netft.${match[1]}`,
        name: match[1],
        qualifiedName: `netft::${match[1]}`,
        category: 'enum',
        declaration: clean(match[0]),
        sourcePath,
        fields: [],
        methods: [],
        values: match[2]
          .split(',')
          .map(clean)
          .filter(Boolean)
          .map((name) => ({name})),
        bases: [],
      });
    }

    for (const match of source.matchAll(
      /^struct\s+(\w+)\s*\{([\s\S]*?)^\};/gm,
    )) {
      symbols.push({
        id: `netft.${match[1]}`,
        name: match[1],
        qualifiedName: `netft::${match[1]}`,
        category: 'struct',
        declaration: `struct ${match[1]}`,
        sourcePath,
        fields: fieldsFrom(match[2]),
        methods: [],
        values: [],
        bases: [],
      });
    }

    for (const match of source.matchAll(
      /^class\s+NETFT_API\s+(\w+)(?:\s*:\s*public\s+([^\{]+))?\s*\{([\s\S]*?)^\};/gm,
    )) {
      const publicBody = match[3]
        .split(/\bprivate\s*:/)[0]
        .replace(/^.*?\bpublic\s*:/s, '');
      const methods = publicBody.split(';').map(methodFrom).filter(Boolean);
      symbols.push({
        id: `netft.${match[1]}`,
        name: match[1],
        qualifiedName: `netft::${match[1]}`,
        category: match[1].endsWith('Error') ? 'exception' : 'class',
        declaration: clean(match[0].slice(0, match[0].indexOf('{'))),
        sourcePath,
        fields: [],
        methods,
        values: [],
        bases: match[2] ? [clean(match[2])] : [],
      });
    }

    for (const match of source.matchAll(
      /NETFT_API\s+([^;\n]+\([^;]+\)(?:\s+noexcept)?)\s*;/g,
    )) {
      const method = methodFrom(match[1]);
      if (!method) continue;
      symbols.push({
        id: `netft.${method.name}.${symbols.filter((item) => item.id.startsWith(`netft.${method.name}.`)).length + 1}`,
        name: method.name,
        qualifiedName: `netft::${method.name}`,
        category: 'function',
        declaration: method.signature,
        sourcePath,
        fields: [],
        methods: [method],
        values: [],
        bases: [],
      });
    }
  }

  symbols.sort((left, right) => left.id.localeCompare(right.id));
  return {
    schemaVersion: 1,
    kind: 'cpp-api',
    component: 'netft-cpp',
    ...metadata,
    symbols,
  };
}
