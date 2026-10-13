# ro-crate-masp-validator

Validates an RO-Crate against a [RO-Crate MASP](https://github.com/Language-Research-Technology/ro-crate-masp) profile or schema crate.

Not on npm yet. Install from GitHub:

```bash
npm install github:crate-works/ro-crate-masp-validator
```

## Use

```js
const { ROCrate } = require("ro-crate");
const { MaspValidator } = require("ro-crate-masp-validator");

const profile = new ROCrate(profileJson, { array: true, link: true });
const target = new ROCrate(targetJson, { array: true, link: true });

const results = await new MaspValidator(profile).validateCrate(target);
// results.error   -> [{ message, rule, entity }]
// results.success -> [{ message, rule }]
```

Command line:

```bash
npx masp-validate [--json] <target-crate.json> <profile-crate.json>
```

Exit code is 0 if the crate passes, 2 if it has validation errors, 1 if a file can't be read.

### Try it

From a clone of this repo, validate the workflow example in `test-data/` against the workflow profile:

```bash
npm install
node bin/masp-validate.js \
  test-data/profiles/workflow/examples/minimal-example/ro-crate-metadata.json \
  test-data/profiles/workflow/profile-crate/ro-crate-metadata.json
```

It reports one error, because the example crate has no `Profile` entity:

```
[ERROR] Expected at least 1 instances of Profile : http://schema.org/CreativeWork, http://schema.org/Profile, found 0
```

Add `--json` before the paths to see the full results, passes included.

## Tests

```bash
npm install
npm test
```

Test fixtures in `test-data/` are copied from ro-crate-masp; see `test-data/README.md`.
