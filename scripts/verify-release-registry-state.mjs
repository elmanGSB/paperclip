#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const CANARY_VERSION_RE = /-canary\.\d+$/;
<<<<<<< HEAD
=======
const EXIT_RETRIABLE_FAILURE = 1;
const EXIT_NON_RETRIABLE_FAILURE = 2;
>>>>>>> upstream/master

export function isCanaryVersion(version) {
  return CANARY_VERSION_RE.test(version);
}

<<<<<<< HEAD
=======
function createExitError(message, exitCode = EXIT_RETRIABLE_FAILURE) {
  return Object.assign(new Error(message), { exitCode });
}

function createProblem(message, { retriable = true } = {}) {
  return { message, retriable };
}

>>>>>>> upstream/master
function usage() {
  process.stderr.write(
    [
      "Usage:",
      "  node scripts/verify-release-registry-state.mjs --channel <canary|stable> --dist-tag <tag> --target-version <version> --package <name> [--package <name> ...] [--allow-canary-latest]",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const options = {
    channel: "",
    distTag: "",
    targetVersion: "",
    allowCanaryLatest: false,
    packages: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--channel":
        options.channel = argv[index + 1] ?? "";
        index += 1;
        break;
      case "--dist-tag":
        options.distTag = argv[index + 1] ?? "";
        index += 1;
        break;
      case "--target-version":
        options.targetVersion = argv[index + 1] ?? "";
        index += 1;
        break;
      case "--package":
        options.packages.push(argv[index + 1] ?? "");
        index += 1;
        break;
      case "--allow-canary-latest":
        options.allowCanaryLatest = true;
        break;
      case "-h":
      case "--help":
        usage();
        process.exit(0);
      default:
<<<<<<< HEAD
        throw new Error(`unexpected argument: ${arg}`);
=======
        throw createExitError(`unexpected argument: ${arg}`, EXIT_NON_RETRIABLE_FAILURE);
>>>>>>> upstream/master
    }
  }

  if (options.channel !== "canary" && options.channel !== "stable") {
<<<<<<< HEAD
    throw new Error("--channel must be canary or stable");
  }

  if (!options.distTag) {
    throw new Error("--dist-tag is required");
  }

  if (!options.targetVersion) {
    throw new Error("--target-version is required");
  }

  if (options.packages.length === 0 || options.packages.some((name) => !name)) {
    throw new Error("at least one non-empty --package value is required");
  }

  if (options.allowCanaryLatest && options.channel !== "canary") {
    throw new Error("--allow-canary-latest only applies to canary releases");
=======
    throw createExitError("--channel must be canary or stable", EXIT_NON_RETRIABLE_FAILURE);
  }

  if (!options.distTag) {
    throw createExitError("--dist-tag is required", EXIT_NON_RETRIABLE_FAILURE);
  }

  if (!options.targetVersion) {
    throw createExitError("--target-version is required", EXIT_NON_RETRIABLE_FAILURE);
  }

  if (options.packages.length === 0 || options.packages.some((name) => !name)) {
    throw createExitError("at least one non-empty --package value is required", EXIT_NON_RETRIABLE_FAILURE);
  }

  if (options.allowCanaryLatest && options.channel !== "canary") {
    throw createExitError("--allow-canary-latest only applies to canary releases", EXIT_NON_RETRIABLE_FAILURE);
>>>>>>> upstream/master
  }

  return options;
}

<<<<<<< HEAD
function createRegistryUrl(packageName) {
  const registry = process.env.npm_config_registry ?? process.env.NPM_CONFIG_REGISTRY ?? "https://registry.npmjs.org/";
  return new URL(encodeURIComponent(packageName), registry.endsWith("/") ? registry : `${registry}/`);
}

async function fetchPackageDocument(packageName, { allowMissing = false } = {}) {
  const url = createRegistryUrl(packageName);
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.npm.install-v1+json, application/json;q=0.9",
    },
  });
=======
function createRegistryUrl(packageName, version = "") {
  const registry = process.env.npm_config_registry ?? process.env.NPM_CONFIG_REGISTRY ?? "https://registry.npmjs.org/";
  const baseUrl = registry.endsWith("/") ? registry : `${registry}/`;
  const encodedPackage = encodeURIComponent(packageName);

  if (!version) {
    return new URL(encodedPackage, baseUrl);
  }

  return new URL(`${encodedPackage}/${encodeURIComponent(version)}`, baseUrl);
}

export async function fetchRegistryJson(url, { allowMissing = false, timeoutMs = 30_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/vnd.npm.install-v1+json, application/json;q=0.9",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`npm registry request timed out for ${url} after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
>>>>>>> upstream/master

  if (response.status === 404 && allowMissing) {
    return null;
  }

  if (!response.ok) {
<<<<<<< HEAD
    throw new Error(`npm registry request failed for ${packageName}: ${response.status} ${response.statusText}`);
=======
    throw new Error(`npm registry request failed for ${url}: ${response.status} ${response.statusText}`);
>>>>>>> upstream/master
  }

  return response.json();
}

<<<<<<< HEAD
export function collectInternalDependencyProblems(manifest, packageDocsByName) {
=======
async function fetchPackageDocument(packageName, { allowMissing = false } = {}) {
  return fetchRegistryJson(createRegistryUrl(packageName), { allowMissing });
}

async function fetchPackageManifest(packageName, version, { allowMissing = false } = {}) {
  return fetchRegistryJson(createRegistryUrl(packageName, version), { allowMissing });
}

export function createManifestLookupKey(packageName, version) {
  return `${packageName}@${version}`;
}

function isRangeVersionSpecifier(version) {
  return /[\^~*xX><| ]/.test(version);
}

function resolvePublishedManifest(packageName, version, packageDoc, packageManifestsByKey = new Map()) {
  const directManifest = packageManifestsByKey.get(createManifestLookupKey(packageName, version));
  if (directManifest) {
    return directManifest;
  }

  if (directManifest === null) {
    return null;
  }

  return packageDoc?.versions?.[version] ?? null;
}

function collectInternalDependencyProblemEntries(
  manifest,
  packageDocsByName,
  packageManifestsByKey = new Map(),
) {
>>>>>>> upstream/master
  const problems = [];
  const sections = [
    ["dependencies", manifest.dependencies ?? {}],
    ["optionalDependencies", manifest.optionalDependencies ?? {}],
    ["peerDependencies", manifest.peerDependencies ?? {}],
  ];

  for (const [sectionName, deps] of sections) {
    for (const [dependencyName, dependencyVersion] of Object.entries(deps)) {
      if (!dependencyName.startsWith("@paperclipai/")) {
        continue;
      }

      if (typeof dependencyVersion !== "string" || !dependencyVersion) {
        problems.push(
<<<<<<< HEAD
          `${sectionName} declares ${dependencyName} with a non-string version: ${JSON.stringify(dependencyVersion)}`,
=======
          createProblem(
            `${sectionName} declares ${dependencyName} with a non-string version: ${JSON.stringify(dependencyVersion)}`,
          ),
>>>>>>> upstream/master
        );
        continue;
      }

<<<<<<< HEAD
      const dependencyDoc = packageDocsByName.get(dependencyName);
      if (!dependencyDoc) {
        problems.push(`${sectionName} requires ${dependencyName}@${dependencyVersion}, but that package is not published`);
        continue;
      }

      if (!(dependencyVersion in (dependencyDoc.versions ?? {}))) {
        problems.push(
          `${sectionName} requires ${dependencyName}@${dependencyVersion}, but npm does not expose that version`,
=======
      // Peer dependency ranges express compatibility, not a manifest that can be fetched directly.
      if (sectionName === "peerDependencies" && isRangeVersionSpecifier(dependencyVersion)) {
        continue;
      }

      const dependencyManifest = resolvePublishedManifest(
        dependencyName,
        dependencyVersion,
        packageDocsByName.get(dependencyName),
        packageManifestsByKey,
      );
      const dependencyLookupKey = createManifestLookupKey(dependencyName, dependencyVersion);

      if (!dependencyManifest) {
        const dependencyDoc = packageDocsByName.get(dependencyName);
        if (!dependencyDoc && !packageManifestsByKey.has(dependencyLookupKey)) {
          problems.push(
            createProblem(
              `${sectionName} requires ${dependencyName}@${dependencyVersion}, but npm publication metadata was not fetched for that dependency`,
            ),
          );
          continue;
        }

        problems.push(
          createProblem(
            `${sectionName} requires ${dependencyName}@${dependencyVersion}, but npm does not expose that version`,
          ),
>>>>>>> upstream/master
        );
      }
    }
  }

  return problems;
}

<<<<<<< HEAD
function requireManifest(packageName, version, packageDoc, problems) {
  const manifest = packageDoc.versions?.[version];
  if (!manifest) {
    if (problems) {
      problems.push(`${packageName}: npm registry is missing manifest data for ${version}`);
=======
export function collectInternalDependencyProblems(
  manifest,
  packageDocsByName,
  packageManifestsByKey = new Map(),
) {
  return collectInternalDependencyProblemEntries(
    manifest,
    packageDocsByName,
    packageManifestsByKey,
  ).map((problem) => problem.message);
}

function requireManifest(packageName, version, packageDoc, packageManifestsByKey, problems) {
  const manifest = resolvePublishedManifest(packageName, version, packageDoc, packageManifestsByKey);
  if (!manifest) {
    if (problems) {
      problems.push(createProblem(`${packageName}: npm registry is missing manifest data for ${version}`));
>>>>>>> upstream/master
    }
    return null;
  }
  return manifest;
}

<<<<<<< HEAD
export function verifyPackageRegistryState({
  packageName,
  packageDoc,
  packageDocsByName,
=======
export function verifyPackageRegistryProblems({
  packageName,
  packageDoc,
  packageDocsByName,
  packageManifestsByKey = new Map(),
>>>>>>> upstream/master
  channel,
  distTag,
  targetVersion,
  allowCanaryLatest,
}) {
  const problems = [];
  const distTags = packageDoc["dist-tags"] ?? {};
  const taggedVersion = distTags[distTag];

  if (taggedVersion !== targetVersion) {
    problems.push(
<<<<<<< HEAD
      `${packageName}: dist-tag ${distTag} resolves to ${taggedVersion ?? "<missing>"}, expected ${targetVersion}`,
    );
  }

  const targetManifest = requireManifest(packageName, targetVersion, packageDoc, problems);
  if (targetManifest) {
    for (const problem of collectInternalDependencyProblems(targetManifest, packageDocsByName)) {
      problems.push(`${packageName}@${targetVersion}: ${problem}`);
=======
      createProblem(
        `${packageName}: dist-tag ${distTag} resolves to ${taggedVersion ?? "<missing>"}, expected ${targetVersion}`,
      ),
    );
  }

  const targetManifest = requireManifest(packageName, targetVersion, packageDoc, packageManifestsByKey, problems);
  if (targetManifest) {
    for (const problem of collectInternalDependencyProblemEntries(
      targetManifest,
      packageDocsByName,
      packageManifestsByKey,
    )) {
      problems.push(createProblem(`${packageName}@${targetVersion}: ${problem.message}`, problem));
>>>>>>> upstream/master
    }
  }

  if (channel === "canary") {
    const latestVersion = distTags.latest;

    if (latestVersion && isCanaryVersion(latestVersion) && !allowCanaryLatest) {
      problems.push(
<<<<<<< HEAD
        `${packageName}: latest dist-tag still resolves to canary ${latestVersion}; rerun with --allow-canary-latest only when that state is intentional`,
=======
        createProblem(
          `${packageName}: latest dist-tag still resolves to canary ${latestVersion}; if that state is intentional, rerun the verification script directly with --allow-canary-latest`,
          { retriable: false },
        ),
>>>>>>> upstream/master
      );
    }

    if (latestVersion && isCanaryVersion(latestVersion)) {
<<<<<<< HEAD
      const latestManifest = requireManifest(packageName, latestVersion, packageDoc, problems);
      if (latestManifest) {
        for (const problem of collectInternalDependencyProblems(latestManifest, packageDocsByName)) {
          problems.push(`${packageName}@${latestVersion} via latest: ${problem}`);
=======
      const latestManifest = requireManifest(
        packageName,
        latestVersion,
        packageDoc,
        packageManifestsByKey,
        problems,
      );
      if (latestManifest) {
        for (const problem of collectInternalDependencyProblemEntries(
          latestManifest,
          packageDocsByName,
          packageManifestsByKey,
        )) {
          problems.push(createProblem(`${packageName}@${latestVersion} via latest: ${problem.message}`, problem));
>>>>>>> upstream/master
        }
      }
    }
  }

  return problems;
}

<<<<<<< HEAD
=======
export function verifyPackageRegistryState(options) {
  return verifyPackageRegistryProblems(options).map((problem) => problem.message);
}

function collectInternalDependencyVersions(manifest) {
  const dependencyVersions = [];

  for (const [sectionName, deps] of [
    ["dependencies", manifest.dependencies ?? {}],
    ["optionalDependencies", manifest.optionalDependencies ?? {}],
    ["peerDependencies", manifest.peerDependencies ?? {}],
  ]) {
    for (const [dependencyName, dependencyVersion] of Object.entries(deps)) {
      if (!dependencyName.startsWith("@paperclipai/")) {
        continue;
      }

      if (typeof dependencyVersion !== "string" || !dependencyVersion) {
        continue;
      }

      if (sectionName === "peerDependencies" && isRangeVersionSpecifier(dependencyVersion)) {
        continue;
      }

      dependencyVersions.push({
        packageName: dependencyName,
        version: dependencyVersion,
      });
    }
  }

  return dependencyVersions;
}

>>>>>>> upstream/master
async function main() {
  const options = parseArgs(process.argv.slice(2));
  const packageNames = [...new Set(options.packages)];
  const packageDocsByName = new Map();
<<<<<<< HEAD
=======
  const packageManifestsByKey = new Map();
>>>>>>> upstream/master

  await Promise.all(
    packageNames.map(async (packageName) => {
      packageDocsByName.set(packageName, await fetchPackageDocument(packageName));
    }),
  );

<<<<<<< HEAD
  const additionalInternalDeps = new Set();
  for (const packageDoc of packageDocsByName.values()) {
    const versionsToCheck = new Set([options.targetVersion]);
    const latestVersion = packageDoc["dist-tags"]?.latest;
    if (latestVersion && isCanaryVersion(latestVersion)) {
      versionsToCheck.add(latestVersion);
    }

    for (const version of versionsToCheck) {
      const manifest = packageDoc.versions?.[version];
=======
  const versionsToFetchByPackage = new Map();
  for (const packageName of packageNames) {
    const packageDoc = packageDocsByName.get(packageName);
    const versionsToFetch = new Set([options.targetVersion]);
    const latestVersion = packageDoc?.["dist-tags"]?.latest;
    if (latestVersion && isCanaryVersion(latestVersion)) {
      versionsToFetch.add(latestVersion);
    }
    versionsToFetchByPackage.set(packageName, versionsToFetch);
  }

  await Promise.all(
    [...versionsToFetchByPackage.entries()].flatMap(([packageName, versionsToFetch]) =>
      [...versionsToFetch].map(async (version) => {
        packageManifestsByKey.set(
          createManifestLookupKey(packageName, version),
          await fetchPackageManifest(packageName, version, { allowMissing: true }),
        );
      }),
    ),
  );

  const dependencyVersionsByKey = new Map();
  for (const [packageName, versionsToFetch] of versionsToFetchByPackage.entries()) {
    for (const version of versionsToFetch) {
      const manifest = resolvePublishedManifest(
        packageName,
        version,
        packageDocsByName.get(packageName),
        packageManifestsByKey,
      );
>>>>>>> upstream/master
      if (!manifest) {
        continue;
      }

<<<<<<< HEAD
      for (const deps of [
        manifest.dependencies ?? {},
        manifest.optionalDependencies ?? {},
        manifest.peerDependencies ?? {},
      ]) {
        for (const dependencyName of Object.keys(deps)) {
          if (dependencyName.startsWith("@paperclipai/")) {
            additionalInternalDeps.add(dependencyName);
          }
        }
=======
      for (const dependencyVersion of collectInternalDependencyVersions(manifest)) {
        dependencyVersionsByKey.set(
          createManifestLookupKey(dependencyVersion.packageName, dependencyVersion.version),
          dependencyVersion,
        );
>>>>>>> upstream/master
      }
    }
  }

<<<<<<< HEAD
  const missingDeps = [...additionalInternalDeps].filter((dep) => !packageDocsByName.has(dep));
  await Promise.all(
    missingDeps.map(async (dependencyName) => {
      packageDocsByName.set(
        dependencyName,
        await fetchPackageDocument(dependencyName, { allowMissing: true }),
=======
  await Promise.all(
    [...dependencyVersionsByKey.values()].map(async ({ packageName, version }) => {
      const lookupKey = createManifestLookupKey(packageName, version);
      if (packageManifestsByKey.has(lookupKey)) {
        return;
      }

      packageManifestsByKey.set(
        lookupKey,
        await fetchPackageManifest(packageName, version, { allowMissing: true }),
>>>>>>> upstream/master
      );
    }),
  );

  const problems = [];

  for (const packageName of packageNames) {
    process.stdout.write(`  Verifying ${packageName} on dist-tag ${options.distTag}\n`);
<<<<<<< HEAD
    const packageProblems = verifyPackageRegistryState({
      packageName,
      packageDoc: packageDocsByName.get(packageName),
      packageDocsByName,
=======
    const packageProblems = verifyPackageRegistryProblems({
      packageName,
      packageDoc: packageDocsByName.get(packageName),
      packageDocsByName,
      packageManifestsByKey,
>>>>>>> upstream/master
      channel: options.channel,
      distTag: options.distTag,
      targetVersion: options.targetVersion,
      allowCanaryLatest: options.allowCanaryLatest,
    });

    if (packageProblems.length === 0) {
      process.stdout.write(`    ✓ dist-tag and published internal dependencies are consistent\n`);
      continue;
    }

    for (const problem of packageProblems) {
<<<<<<< HEAD
      process.stderr.write(`    ✗ ${problem}\n`);
=======
      process.stderr.write(`    ✗ ${problem.message}\n`);
>>>>>>> upstream/master
      problems.push(problem);
    }
  }

  if (problems.length > 0) {
<<<<<<< HEAD
    throw new Error(`npm registry verification failed for ${problems.length} problem(s)`);
=======
    const exitCode = problems.some((problem) => !problem.retriable)
      ? EXIT_NON_RETRIABLE_FAILURE
      : EXIT_RETRIABLE_FAILURE;
    throw createExitError(`npm registry verification failed for ${problems.length} problem(s)`, exitCode);
>>>>>>> upstream/master
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
<<<<<<< HEAD
    process.exit(1);
=======
    process.exit(error.exitCode ?? EXIT_RETRIABLE_FAILURE);
>>>>>>> upstream/master
  });
}
