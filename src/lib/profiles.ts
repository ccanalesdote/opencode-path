import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Profile definitions
//
// Each profile has two variants:
//   dev      — applied to developer.md
//              May include controlled mutating commands (formatters, builds)
//              listed as "ask" so the user confirms before they run.
//   readonly — applied to auditor.md and reviewer.md
//              Contains only validation/inspection commands that do not
//              modify files. Formatter commands that write to disk are
//              intentionally excluded from this variant.
//
// Profile entries are the canonical definitions used by oc-workflow profiles.
// ---------------------------------------------------------------------------

export interface ProfileEntry {
  pattern: string;
  permission: "allow" | "ask" | "deny";
}

export interface Profile {
  /** Machine-readable profile name (e.g., "javascript-typescript") */
  name: string;
  /** Human-readable label (e.g., "JavaScript / TypeScript") */
  label: string;
  /** Developer variant — includes controlled mutating commands as "ask" */
  dev: ProfileEntry[];
  /** Read-only variant — only validation/inspection commands */
  readonly: ProfileEntry[];
}

// --- JavaScript / TypeScript ------------------------------------------------
// All commands here are read-only validation; both variants are identical.
const JAVASCRIPT_TYPESCRIPT_DEV: ProfileEntry[] = [
  { pattern: "npm test*", permission: "allow" },
  { pattern: "npm run test*", permission: "allow" },
  { pattern: "npm run coverage*", permission: "allow" },
  { pattern: "npm run lint*", permission: "allow" },
  { pattern: "npm run typecheck*", permission: "allow" },
  { pattern: "npm run check*", permission: "allow" },
  { pattern: "pnpm test*", permission: "allow" },
  { pattern: "pnpm coverage*", permission: "allow" },
  { pattern: "pnpm lint*", permission: "allow" },
  { pattern: "pnpm typecheck*", permission: "allow" },
  { pattern: "pnpm check*", permission: "allow" },
  { pattern: "yarn test*", permission: "allow" },
  { pattern: "yarn coverage*", permission: "allow" },
  { pattern: "yarn lint*", permission: "allow" },
  { pattern: "yarn typecheck*", permission: "allow" },
  { pattern: "yarn check*", permission: "allow" },
  { pattern: "npx jest*", permission: "allow" },
  { pattern: "npx vitest*", permission: "allow" },
  { pattern: "npx tsc*", permission: "allow" },
  { pattern: "npx eslint*", permission: "allow" },
  { pattern: "npx prettier --check*", permission: "allow" },
];
const JAVASCRIPT_TYPESCRIPT_READONLY: ProfileEntry[] = JAVASCRIPT_TYPESCRIPT_DEV;

// --- Python -----------------------------------------------------------------
// All commands here are read-only validation; both variants are identical.
const PYTHON_DEV: ProfileEntry[] = [
  { pattern: "pytest*", permission: "allow" },
  { pattern: "python -m pytest*", permission: "allow" },
  { pattern: "python3 -m pytest*", permission: "allow" },
  { pattern: "ruff check*", permission: "allow" },
  { pattern: "mypy*", permission: "allow" },
  { pattern: "pyright*", permission: "allow" },
  { pattern: "python -m unittest*", permission: "allow" },
  { pattern: "python3 -m unittest*", permission: "allow" },
];
const PYTHON_READONLY: ProfileEntry[] = PYTHON_DEV;

// --- Go ---------------------------------------------------------------------
// Developer variant includes go fmt (mutates files) listed as ask.
// Read-only variant omits go fmt / gofmt to preserve Auditor/Reviewer safety.
const GO_DEV: ProfileEntry[] = [
  { pattern: "go test*", permission: "allow" },
  { pattern: "go vet*", permission: "allow" },
  { pattern: "go fmt*", permission: "ask" },
  { pattern: "gofmt*", permission: "ask" },
];
const GO_READONLY: ProfileEntry[] = [
  { pattern: "go test*", permission: "allow" },
  { pattern: "go vet*", permission: "allow" },
];

// --- Rust -------------------------------------------------------------------
// Developer variant includes cargo fmt (mutates files) listed as ask.
// cargo fmt --check is safe for both roles; cargo fmt (without --check) is dev-only.
const RUST_DEV: ProfileEntry[] = [
  { pattern: "cargo test*", permission: "allow" },
  { pattern: "cargo check*", permission: "allow" },
  { pattern: "cargo clippy*", permission: "allow" },
  { pattern: "cargo fmt*", permission: "ask" },
  { pattern: "cargo fmt --check*", permission: "allow" },
];
const RUST_READONLY: ProfileEntry[] = [
  { pattern: "cargo test*", permission: "allow" },
  { pattern: "cargo check*", permission: "allow" },
  { pattern: "cargo clippy*", permission: "allow" },
  { pattern: "cargo fmt --check*", permission: "allow" },
];

// --- Swift ------------------------------------------------------------------
// Developer variant includes swift build and swift format (both may write
// artifacts or reformat files) listed as ask.
// Read-only variant includes only swift test and swift format lint (check mode).
const SWIFT_DEV: ProfileEntry[] = [
  { pattern: "swift test*", permission: "allow" },
  { pattern: "swift build*", permission: "ask" },
  { pattern: "swift format*", permission: "ask" },
  { pattern: "swift format lint*", permission: "allow" },
  { pattern: "xcodebuild test*", permission: "ask" },
];
const SWIFT_READONLY: ProfileEntry[] = [
  { pattern: "swift test*", permission: "allow" },
  { pattern: "swift format lint*", permission: "allow" },
];

// --- Java / Kotlin ----------------------------------------------------------
// All commands here are read-only validation; both variants are identical.
const JAVA_KOTLIN_DEV: ProfileEntry[] = [
  { pattern: "./gradlew test*", permission: "allow" },
  { pattern: "./gradlew check*", permission: "allow" },
  { pattern: "./gradlew ktlintCheck*", permission: "allow" },
  { pattern: "./gradlew detekt*", permission: "allow" },
  { pattern: "gradle test*", permission: "allow" },
  { pattern: "gradle check*", permission: "allow" },
  { pattern: "mvn test*", permission: "allow" },
  { pattern: "mvn verify*", permission: "allow" },
];
const JAVA_KOTLIN_READONLY: ProfileEntry[] = JAVA_KOTLIN_DEV;

// --- Ruby -------------------------------------------------------------------
// All commands here are read-only validation; both variants are identical.
const RUBY_DEV: ProfileEntry[] = [
  { pattern: "bundle exec rspec*", permission: "allow" },
  { pattern: "bundle exec rubocop*", permission: "allow" },
  { pattern: "ruby -c*", permission: "allow" },
  { pattern: "rails test*", permission: "allow" },
];
const RUBY_READONLY: ProfileEntry[] = RUBY_DEV;

// --- PHP --------------------------------------------------------------------
// All commands here are read-only validation; both variants are identical.
const PHP_DEV: ProfileEntry[] = [
  { pattern: "composer test*", permission: "allow" },
  { pattern: "vendor/bin/phpunit*", permission: "allow" },
  { pattern: "vendor/bin/phpstan*", permission: "allow" },
  { pattern: "vendor/bin/psalm*", permission: "allow" },
  { pattern: "vendor/bin/phpcs*", permission: "allow" },
];
const PHP_READONLY: ProfileEntry[] = PHP_DEV;

// ---------------------------------------------------------------------------
// All profiles (ordered)
// ---------------------------------------------------------------------------
export const PROFILES: Profile[] = [
  {
    name: "javascript-typescript",
    label: "JavaScript / TypeScript",
    dev: JAVASCRIPT_TYPESCRIPT_DEV,
    readonly: JAVASCRIPT_TYPESCRIPT_READONLY,
  },
  {
    name: "python",
    label: "Python",
    dev: PYTHON_DEV,
    readonly: PYTHON_READONLY,
  },
  {
    name: "go",
    label: "Go",
    dev: GO_DEV,
    readonly: GO_READONLY,
  },
  {
    name: "rust",
    label: "Rust",
    dev: RUST_DEV,
    readonly: RUST_READONLY,
  },
  {
    name: "swift",
    label: "Swift",
    dev: SWIFT_DEV,
    readonly: SWIFT_READONLY,
  },
  {
    name: "java-kotlin",
    label: "Java / Kotlin",
    dev: JAVA_KOTLIN_DEV,
    readonly: JAVA_KOTLIN_READONLY,
  },
  {
    name: "ruby",
    label: "Ruby",
    dev: RUBY_DEV,
    readonly: RUBY_READONLY,
  },
  {
    name: "php",
    label: "PHP",
    dev: PHP_DEV,
    readonly: PHP_READONLY,
  },
];

export const PROFILE_NAMES = PROFILES.map((p) => p.name);
export type ProfileName = (typeof PROFILE_NAMES)[number];

/**
 * Look up a profile by name.
 */
export function getProfile(name: string): Profile | undefined {
  return PROFILES.find((p) => p.name === name);
}

// ---------------------------------------------------------------------------
// Snippet generation
// ---------------------------------------------------------------------------

/** Indentation for bash permission entries inside YAML frontmatter */
const INDENT = "    ";

/**
 * The marker line that indicates where profile blocks should be inserted.
 * Must match the marker in the agent template files.
 */
export const PROFILE_MARKER =
  "# Optional stack-specific profiles are inserted here by oc-workflow profiles";

/**
 * Generate a profile snippet block for insertion into an agent file.
 */
export function generateSnippet(
  entries: ProfileEntry[],
  profileName: string
): string {
  const lines: string[] = [];
  lines.push(INDENT + "# BEGIN optional profile: " + profileName);
  for (const entry of entries) {
    lines.push(INDENT + '"' + entry.pattern + '": "' + entry.permission + '"');
  }
  lines.push(INDENT + "# END optional profile: " + profileName);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Profile insertion logic
// ---------------------------------------------------------------------------

export interface InsertProfileResult {
  /** Whether the profile was inserted (false = already existed or marker not found) */
  inserted: boolean;
  /** Reason if not inserted */
  reason?: "already_exists" | "marker_not_found";
}

export type PerFileStatus = "inserted" | "already_exists" | "marker_not_found" | "file_missing";

export interface ProfileApplyResult {
  profileName: string;
  profileLabel: string;
  files: { agent: string; status: PerFileStatus }[];
}

export function applyProfileToAgents(
  agentDir: string,
  profile: Profile,
  agents: { name: string; variant: "dev" | "readonly" }[]
): ProfileApplyResult {
  const files: ProfileApplyResult["files"] = [];

  for (const agent of agents) {
    const agentPath = join(agentDir, agent.name + ".md");

    if (!existsSync(agentPath)) {
      files.push({ agent: agent.name, status: "file_missing" });
      continue;
    }

    const result = insertProfileIntoFile(agentPath, profile, agent.variant);

    if (result.inserted) {
      files.push({ agent: agent.name, status: "inserted" });
    } else if (result.reason === "already_exists") {
      files.push({ agent: agent.name, status: "already_exists" });
    } else if (result.reason === "marker_not_found") {
      files.push({ agent: agent.name, status: "marker_not_found" });
    }
  }

  return { profileName: profile.name, profileLabel: profile.label, files };
}

/**
 * Check if a profile block already exists in file content.
 */
export function profileExistsInContent(
  content: string,
  profileName: string
): boolean {
  const beginMarker = "# BEGIN optional profile: " + profileName;
  return content.includes(beginMarker);
}

/**
 * Insert a profile snippet into a file after the marker line.
 * Returns the result indicating whether insertion happened and why not if it didn't.
 *
 * This function is idempotent: if the profile block already exists, it is not
 * duplicated.
 */
export function insertProfileIntoFile(
  filePath: string,
  profile: Profile,
  variant: "dev" | "readonly"
): InsertProfileResult {
  const content = readFileSync(filePath, "utf-8");

  if (profileExistsInContent(content, profile.name)) {
    return { inserted: false, reason: "already_exists" };
  }

  const lines = content.split("\n");
  let markerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(PROFILE_MARKER)) {
      markerIndex = i;
      break;
    }
  }

  if (markerIndex === -1) {
    return { inserted: false, reason: "marker_not_found" };
  }

  const entries = variant === "dev" ? profile.dev : profile.readonly;
  const snippet = generateSnippet(entries, profile.name);

  const newLines = [
    ...lines.slice(0, markerIndex + 1),
    snippet,
    ...lines.slice(markerIndex + 1),
  ];

  writeFileSync(filePath, newLines.join("\n"), "utf-8");
  return { inserted: true };
}
