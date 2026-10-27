// knip: `pnpm knip` and `pnpm knip --production`, both in CI. As stackables-cloud/factory's knip.ts, a module so the two
// runs can differ in one thing: whether a use in the export's own file counts.
//   - pnpm knip: every export needs an importer, a test included. An export only its own file uses is not exported.
//   - pnpm knip --production: the tests left out, so every function needs a caller that is not a test. Code only a test
//     calls is dead: delete it, or move it into the test.
import type { KnipConfig } from "knip";

const production = process.argv.includes("--production");

export default {
    // includeEntryExports stays off, unlike monocore and factory: this is a published package, and what src/embed.ts and
    // src/react.tsx export is its API, used by sites knip cannot see.
    ignoreExportsUsedInFile: production,
    include: [
        "files",
        "dependencies",
        "unlisted",
        "binaries",
        "unresolved",
        "exports",
        "types",
        "nsTypes",
        "enumMembers",
        "namespaceMembers",
        "duplicates",
        "cycles",
    ],
    // knip finds the entries itself: src/embed.ts and src/react.tsx from package.json's exports, build.mjs from the build
    // script, the tests from the test script. Patterns with `!` are production: what --production checks.
    project: ["src/**!", "tests/**"],
} satisfies KnipConfig;
