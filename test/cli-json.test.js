const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

// With --json, stdout holds only the results JSON, whose "error" list has every
// validation error; the [ERROR] summary goes to stderr. An unreadable input
// gives no results: only a message on stderr and exit code 1.
describe("masp-validate --json", function () {
  this.timeout(20000);

  const cli = path.join(__dirname, "../bin/masp-validate.js");
  const profile = path.join(
    __dirname,
    "../test-data/profiles/workflow/profile-crate/ro-crate-metadata.json"
  );
  const validCrate = path.join(
    __dirname,
    "../test-data/profiles/workflow/examples/minimal-example/ro-crate-metadata.json"
  );
  let tmpDir;
  let emptyCrate;

  before(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "masp-cli-"));
    emptyCrate = path.join(tmpDir, "empty.json");
    fs.writeFileSync(
      emptyCrate,
      JSON.stringify({
        "@context": "https://w3id.org/ro/crate/1.2/context",
        "@graph": [],
      })
    );
  });

  after(function () {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(...args) {
    return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  }

  function expectResultsShape(json) {
    expect(json).to.have.all.keys("error", "success", "rules", "ruleFlags");
    expect(json.error).to.be.an("array");
    expect(json.success).to.be.an("array");
  }

  it("prints only the results for a valid crate", function () {
    const out = run("--json", validCrate, profile);
    expect(out.status).to.equal(0);
    const json = JSON.parse(out.stdout);
    expectResultsShape(json);
    expect(json.error).to.be.empty;
  });

  it("keeps the error summary out of stdout for an invalid crate", function () {
    const out = run("--json", emptyCrate, profile);
    expect(out.status).to.equal(2);
    const json = JSON.parse(out.stdout);
    expectResultsShape(json);
    expect(json.error).to.not.be.empty;
    // Each line on stderr is one entry of "error", in the same order
    const lines = out.stderr.trimEnd().split("\n");
    expect(lines).to.deep.equal(json.error.map((e) => `[ERROR] ${e.message}`));
  });

  it("reports an unreadable crate on stderr only, with exit code 1", function () {
    const out = run("--json", path.join(tmpDir, "missing.json"), profile);
    expect(out.status).to.equal(1);
    expect(out.stdout).to.equal("");
    expect(out.stderr).to.include("Validation failed:");
  });

  it("keeps the summary on stdout without --json", function () {
    const out = run(emptyCrate, profile);
    expect(out.status).to.equal(2);
    expect(out.stdout).to.match(/^\[ERROR\] /);
  });
});
