const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { ROCrate } = require("ro-crate");
const { MaspValidator } = require("../lib/masp-validator");

// A class count that fails because entities with the right types fail their
// property rules should say which entities and why, not only "found 0".
describe("Count errors explain why entities did not count", function () {
  const profilePath = path.join(
    __dirname,
    "../test-data/profiles/ro-crate/profile-crate/ro-crate-metadata.json"
  );

  function crate(root) {
    return new ROCrate(
      {
        "@context": "https://w3id.org/ro/crate/1.3/context",
        "@graph": [
          {
            "@id": "ro-crate-metadata.json",
            "@type": "CreativeWork",
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.3" },
            about: { "@id": "./" },
          },
          { "@id": "./", "@type": "Dataset", ...root },
          {
            "@id": "https://spdx.org/licenses/CC-BY-4.0",
            "@type": "CreativeWork",
            name: "CC BY 4.0",
          },
        ],
      },
      { array: true, link: true }
    );
  }

  async function validate(root) {
    const profile = new ROCrate(JSON.parse(fs.readFileSync(profilePath, "utf8")), {
      array: true,
      link: true,
    });
    return new MaspValidator(profile).validateCrate(crate(root));
  }

  const complete = {
    name: "x",
    description: "y",
    datePublished: "2026-11-27",
    license: { "@id": "https://spdx.org/licenses/CC-BY-4.0" },
  };

  it("passes a complete root", async function () {
    const results = await validate(complete);
    expect(results.error).to.have.lengthOf(0);
  });

  it("names the root's missing property in the descriptor's count error", async function () {
    const { license, ...withoutLicense } = complete;
    const results = await validate(withoutLicense);
    const messages = results.error.map((e) => e.message);
    const descriptor = messages.find((m) => m.includes("Metadata Descriptor") || m.includes("Metadadata Descriptor"));
    expect(descriptor, messages.join("\n")).to.include("ro-crate-metadata.json");
    expect(descriptor).to.include("license: missing required property license");
  });

  it("does not list entities that fail the rule's @id constraint", async function () {
    const { license, ...withoutLicense } = complete;
    const results = await validate(withoutLicense);
    const messages = results.error.map((e) => e.message).join("\n");
    expect(messages).not.to.include("https://spdx.org/licenses/CC-BY-4.0:");
  });
});
