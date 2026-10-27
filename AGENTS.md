# Checks

The Test workflow runs these on every pull request, and each one fails it:

```bash
pnpm tsc
pnpm knip
pnpm knip --production
pnpm test
pnpm build
```

knip (`knip.ts`) checks for unused files, exports, types, dependencies and import cycles. `pnpm knip --production`
leaves the tests out, so code only a test calls counts as dead: delete it, or move it into the test. An export only its
own file uses is not exported. What `src/embed.ts` and `src/react.tsx` export is the package's API, and knip does not
check it.

# Releases

Releases go through changesets: add one with `pnpm changeset` for a change users should get, then merge the "Version
Packages" pull request. A change without a changeset releases nothing.
