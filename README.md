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

## Tests

```bash
npm install
npm test
```

Test fixtures in `test-data/` are copied from ro-crate-masp; see `test-data/README.md`.
