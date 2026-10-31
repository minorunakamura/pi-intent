import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const roleSkills = {
  ember: [
    "intent",
    "strategize",
    "investigate",
    "storytelling",
    "articulate",
    "philosopher",
  ],
  noor: ["intent", "present", "articulate", "philosopher", "storytelling"],
  rune: ["intent", "specify", "articulate", "philosopher"],
  sage: ["intent", "philosopher", "articulate"],
  vigil: [
    "intent",
    "evaluate",
    "fortify",
    "include",
    "measure",
    "articulate",
    "philosopher",
  ],
  wren: [
    "intent",
    "journey",
    "organize",
    "wireframe",
    "articulate",
    "blueprint",
    "transpose",
    "localize",
    "philosopher",
    "storytelling",
  ],
};

function readAgent(path) {
  const text = readFileSync(path, "utf8");
  const header = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(header, `${path}: frontmatter is required`);
  // The shipped agent headers intentionally use only flat, single-line scalars.
  const fields = Object.fromEntries(
    header[1].split("\n").map((line) => {
      const colon = line.indexOf(":");
      assert.ok(colon > 0, `${path}: expected a scalar field`);
      return [line.slice(0, colon), line.slice(colon + 1).trim()];
    }),
  );
  return { fields, body: text.slice(header[0].length) };
}

await test("the package exposes six namespaced agents without a custom extension", () => {
  assert.deepEqual(manifest.pi.subagents, { agents: ["./agents"] });
  assert.equal(manifest.pi.extensions, undefined);
  assert.deepEqual(manifest.files, [
    "agents",
    "skills",
    "README.md",
    "LICENSE",
  ]);
  assert.deepEqual(
    readdirSync(join(root, "agents")).sort(),
    Object.keys(roleSkills).map((name) => `${name}.md`),
  );
});

for (const [name, skills] of Object.entries(roleSkills)) {
  await test(`intent.${name}: portable tools, model, context, and role skills`, () => {
    const { fields, body } = readAgent(join(root, "agents", `${name}.md`));
    assert.equal(fields.name, name);
    assert.equal(fields.package, "intent");
    assert.ok(fields.description);
    assert.equal(fields.advertise, "true");
    assert.equal(fields.systemPromptMode, "append");
    assert.equal(fields.inheritProjectContext, "true");
    assert.equal(fields.inheritGlobalContext, "true");
    assert.equal(fields.inheritSkills, "false");
    assert.equal(fields.allowNestedSubagents, "false");
    assert.equal(fields.async, "true");
    assert.deepEqual(fields.tools.split(", "), [
      "read",
      "write",
      "edit",
      "bash",
    ]);
    assert.deepEqual(fields.skills.split(", "), skills);
    assert.equal(fields.skillPath, "../skills");
    for (const field of [
      "model",
      "thinking",
      "machine",
      "extensions",
      "subagentOnlyExtensions",
    ]) {
      assert.equal(
        fields[field],
        undefined,
        `${field} must be chosen by the host`,
      );
    }
    assert.match(body, /^## Running in pi$/m);
    assert.ok(body.includes("Load the configured `intent` skill"));
    assert.ok(body.includes("Do not launch other agents"));
    assert.ok(body.includes("do not manufacture consent"));
    assert.ok(body.includes("never in the installed package"));
    assert.ok(body.includes("report the limitation and ask"));
    for (const peer of Object.keys(roleSkills)) {
      assert.ok(body.includes(`\`intent.${peer}\``));
    }
    for (const match of body.matchAll(/\/skill:([a-z][a-z-]*)/g)) {
      assert.ok(
        existsSync(join(root, "skills", match[1], "SKILL.md")),
        match[0],
      );
    }
    const legacy = new RegExp(
      `(?<![\\w/.:])/(?:${readdirSync(join(root, "skills")).join("|")})(?![\\w/.-])`,
      "g",
    );
    assert.doesNotMatch(body, legacy);
    assert.doesNotMatch(body, /mcp__|\/Users\/|\/home\/|WebSearch|WebFetch/);
  });
}

await test("Noor uses the installed present skill for portable output instructions", () => {
  const { body } = readAgent(join(root, "agents", "noor.md"));
  assert.ok(body.includes("read the configured `/skill:present` skill"));
  assert.ok(body.includes("`SKILL_DIR`"));
  assert.ok(body.includes("ask before installing"));
  assert.ok(body.includes("configured connector"));
  assert.ok(body.includes("internet access"));
  assert.doesNotMatch(body, /skills\/present\/references\//);
  assert.doesNotMatch(
    body,
    /install `python-pptx` if missing|both are mandatory before any write/,
  );
});

await test("agent skill references still resolve after moving the distribution", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-intent-agents-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const relocated = join(temporary, "別環境 package");
  for (const file of ["package.json", ...manifest.files]) {
    cpSync(join(root, file), join(relocated, file), { recursive: true });
  }
  const movedManifest = JSON.parse(
    readFileSync(join(relocated, "package.json"), "utf8"),
  );
  const agentsDir = resolve(relocated, movedManifest.pi.subagents.agents[0]);
  for (const name of Object.keys(roleSkills)) {
    const agentPath = join(agentsDir, `${name}.md`);
    const { fields } = readAgent(agentPath);
    const skillsDir = resolve(dirname(agentPath), fields.skillPath);
    assert.equal(skillsDir, join(relocated, "skills"));
    for (const skill of fields.skills.split(", ")) {
      assert.ok(
        existsSync(join(skillsDir, skill, "SKILL.md")),
        `${name}: ${skill}`,
      );
    }
  }
});
