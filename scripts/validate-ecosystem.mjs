import {access, readFile} from 'node:fs/promises';
import path from 'node:path';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const catalogPath = option('--catalog', 'data/ecosystem.json');
const docsRoot = option('--docs-root', 'docs');
const failures = [];

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    failures.push(`${field} must be non-empty text`);
  }
}

async function routeExists(docsPath) {
  const candidates = [
    path.join(docsRoot, `${docsPath}.md`),
    path.join(docsRoot, `${docsPath}.mdx`),
    path.join(docsRoot, docsPath, 'index.md'),
    path.join(docsRoot, docsPath, 'index.mdx'),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // Try the next supported document filename.
    }
  }

  return false;
}

let catalog;
try {
  catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
} catch (error) {
  failures.push(`catalog could not be read: ${error.message}`);
}

const categories = catalog?.categories;
const workflows = catalog?.workflows;
const categoryIds = new Set();
const offerings = new Map();

if (!Array.isArray(categories) || categories.length === 0) {
  failures.push('catalog must contain at least one category');
} else {
  for (const category of categories) {
    requireText(category.id, 'category id');
    requireText(category.label, `${category.id}: category label`);
    requireText(category.summary, `${category.id}: category summary`);

    if (categoryIds.has(category.id)) {
      failures.push(`duplicate category id: ${category.id}`);
    }
    categoryIds.add(category.id);

    if (!Array.isArray(category.offerings) || category.offerings.length === 0) {
      failures.push(`${category.id}: category must contain offerings`);
      continue;
    }

    const priorities = new Set();
    for (const offering of category.offerings) {
      for (const field of [
        'id',
        'name',
        'summary',
        'audience',
        'docsPath',
        'repository',
      ]) {
        requireText(offering[field], `${offering.id ?? category.id}: ${field}`);
      }

      if (offerings.has(offering.id)) {
        failures.push(`duplicate offering id: ${offering.id}`);
      }
      offerings.set(offering.id, {...offering, categoryId: category.id});

      if (!Number.isInteger(offering.priority) || offering.priority < 1) {
        failures.push(`${offering.id}: priority must be a positive integer`);
      } else if (priorities.has(offering.priority)) {
        failures.push(`${category.id}: duplicate offering priority`);
      }
      priorities.add(offering.priority);

      if (
        typeof offering.repository === 'string' &&
        !/^https:\/\/github\.com\/netft\/[a-zA-Z0-9._-]+$/.test(
          offering.repository,
        )
      ) {
        failures.push(
          `${offering.id}: repository must belong to github.com/netft`,
        );
      }

      if (!/^\d+\.\d+\.\d+$/.test(offering.stableVersion ?? '')) {
        failures.push(`${offering.id}: stable version must use X.Y.Z`);
      }
      const supportedPlatforms = new Set(['Linux', 'macOS', 'Windows']);
      if (
        !Array.isArray(offering.platforms) ||
        offering.platforms.length === 0 ||
        offering.platforms.some((platform) => !supportedPlatforms.has(platform))
      ) {
        failures.push(
          `${offering.id}: platform list contains an unsupported value`,
        );
      }
      if (
        !Array.isArray(offering.installMethods) ||
        offering.installMethods.length === 0
      ) {
        failures.push(`${offering.id}: install methods must be non-empty`);
      }
      if (offering.documentationOwner !== 'netft-docs') {
        failures.push(`${offering.id}: documentation owner must be netft-docs`);
      }

      if (
        typeof offering.docsPath === 'string' &&
        !(await routeExists(offering.docsPath))
      ) {
        failures.push(`${offering.id}: documentation route does not exist`);
      }
    }
  }
}

if (!Array.isArray(workflows) || workflows.length === 0) {
  failures.push('catalog must contain at least one workflow');
} else {
  const workflowIds = new Set();
  const priorities = new Set();
  const referencedOfferings = new Set();

  for (const workflow of workflows) {
    requireText(workflow.id, 'workflow id');
    requireText(workflow.label, `${workflow.id}: workflow label`);
    requireText(workflow.summary, `${workflow.id}: workflow summary`);

    if (workflowIds.has(workflow.id)) {
      failures.push(`duplicate workflow id: ${workflow.id}`);
    }
    workflowIds.add(workflow.id);

    if (!Number.isInteger(workflow.priority) || workflow.priority < 1) {
      failures.push(`${workflow.id}: priority must be a positive integer`);
    } else if (priorities.has(workflow.priority)) {
      failures.push('duplicate workflow priority');
    }
    priorities.add(workflow.priority);

    if (
      !Array.isArray(workflow.offeringIds) ||
      workflow.offeringIds.length === 0
    ) {
      failures.push(`${workflow.id}: workflow must reference offerings`);
      continue;
    }

    for (const offeringId of workflow.offeringIds) {
      if (!offerings.has(offeringId)) {
        failures.push(`${workflow.id}: unknown offering: ${offeringId}`);
      }
      referencedOfferings.add(offeringId);
    }
  }

  for (const offeringId of offerings.keys()) {
    if (!referencedOfferings.has(offeringId)) {
      failures.push(`offering is not reachable from a workflow: ${offeringId}`);
    }
  }
}

if (failures.length > 0) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
}
