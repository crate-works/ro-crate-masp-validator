const { describe, it, before } = require("mocha");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { ROCrate } = require("ro-crate");
const { MaspValidator } = require("../lib/masp-validator");

// rdfs:Literal ranges (used by OWL-converted schemas such as DMLex and RiC-O)
// accept any literal; schema:URL ranges require a parseable URL.
// Moved from ro-crate-masp's LDAC-DMLex profile tests.
describe("rdfs:Literal and schema:URL ranges", function () {
  const profilePath = path.join(
    __dirname,
    "../test-data/profiles/literal-and-url/profile-crate/ro-crate-metadata.json"
  );

  let profileCrate;

  before(function () {
    profileCrate = new ROCrate(JSON.parse(fs.readFileSync(profilePath, "utf8")), {
      array: true,
      link: true,
    });
  });

  function targetCrate(thing) {
    return new ROCrate(
      {
        "@context": [
          "https://w3id.org/ro/crate/1.2/context",
          { ex: "https://example.org/terms#" },
        ],
        "@graph": [
          {
            "@id": "ro-crate-metadata.json",
            "@type": "CreativeWork",
            about: { "@id": "./" },
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.2" },
          },
          { "@id": "./", "@type": "Dataset", name: "Test", hasPart: [] },
          { "@id": "#other", "@type": "Thing", name: "Some other entity" },
          { "@id": "#thing", "@type": "ex:Thing", "ex:label": "A thing", ...thing },
        ],
      },
      { array: true, link: true }
    );
  }

  // Property failures make #thing not count as a valid Thing (a class-level
  // error); the reason is recorded per property in results.rules.
  async function errorsFor(thing) {
    const results = await new MaspValidator(profileCrate).validateCrate(targetCrate(thing));
    const propertyErrors = (results.rules["#class_Thing"]?.["#thing"]?.["property-errors"] || []).map(
      (e) => e.message
    );
    return [...results.error.map((e) => e.message), ...propertyErrors];
  }

  describe("rdfs:Literal", function () {
    for (const [kind, value] of [
      ["a string", "abandon"],
      ["a number", 42],
      ["a boolean", true],
    ]) {
      it(`accepts ${kind}`, async function () {
        expect(await errorsFor({ "ex:label": value })).to.deep.equal([]);
      });
    }

    it("rejects a reference to an entity", async function () {
      const errors = await errorsFor({ "ex:label": { "@id": "#other" } });
      expect(errors.join("\n")).to.match(/Property "Label" validation failed for entity #thing/);
    });
  });

  describe("schema:URL", function () {
    it("accepts a URL", async function () {
      expect(await errorsFor({ "ex:homepage": "https://example.org/" })).to.deep.equal([]);
    });

    it("rejects a string that is not a URL", async function () {
      const errors = await errorsFor({ "ex:homepage": "not a url" });
      expect(errors.join("\n")).to.match(/Property "Homepage" validation failed.*"not a url".*schema:URL/);
    });

    it("rejects a number", async function () {
      const errors = await errorsFor({ "ex:homepage": 42 });
      expect(errors.join("\n")).to.match(/Property "Homepage" validation failed/);
    });
  });
});
