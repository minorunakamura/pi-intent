import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const names = [
  "articulate",
  "blueprint",
  "evaluate",
  "fortify",
  "include",
  "intent",
  "investigate",
  "journey",
  "localize",
  "measure",
  "organize",
  "philosopher",
  "present",
  "specify",
  "storytelling",
  "strategize",
  "transpose",
  "wireframe",
];
const skills = names.map((name) => ({
  name,
  path: join(root, "skills", name, "SKILL.md"),
  text: readFileSync(join(root, "skills", name, "SKILL.md"), "utf8"),
}));

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

await test("the package exposes exactly the 18 Intent skills", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.deepEqual(manifest.pi.skills, ["./skills"]);
  assert.deepEqual(readdirSync(join(root, "skills")).sort(), names);
  assert.equal(manifest.license, "CC0-1.0");
  assert.ok(!manifest.dependencies, "no runtime npm dependencies are needed");
  assert.ok(existsSync(join(root, "LICENSE")));
});

for (const { name, path, text } of skills) {
  await test(`${name}: portable frontmatter and pi execution rules`, () => {
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(frontmatter, "YAML frontmatter is required");
    assert.match(frontmatter[1], new RegExp(`^name: ${name}$`, "m"));
    const description = frontmatter[1].match(
      /^description: >\n((?:  .*(?:\n|$))+)/m,
    );
    assert.ok(description, "a folded description is required");
    const folded = description[1]
      .split("\n")
      .map((line) => line.trim())
      .join(" ")
      .trim();
    assert.ok(
      folded.length > 0 && folded.length <= 1024,
      "description must fit the Agent Skills limit",
    );
    assert.match(frontmatter[1], /^license: CC0-1\.0$/m);
    assert.match(frontmatter[1], /^compatibility: .+$/m);
    assert.match(frontmatter[1], /^metadata:\n  upstream-version: "1\.7\.3"$/m);
    assert.match(text, /^## Running in pi$/m);
    assert.ok(text.includes("`../<name>/SKILL.md`"));
    assert.ok(
      text.includes(
        "Run scripts by absolute path from the project working directory",
      ),
    );
    assert.ok(text.includes("Do not modify installed templates"));
    assert.ok(text.includes("Keep every approval checkpoint"));
    assert.ok(
      text.includes(
        "Do not install dependencies or connectors without permission",
      ),
    );
    assert.doesNotMatch(
      text,
      /user-invocable:|^version:|mcp__|Claude's voice|Bash tool|CLAUDE_PLUGIN_ROOT/m,
    );
  });

  await test(`${name}: commands and bundled reference paths resolve`, () => {
    for (const match of text.matchAll(/\/skill:([a-z][a-z-]*)/g)) {
      assert.ok(
        [...names, "figma-use"].includes(match[1]),
        `unknown skill command: ${match[0]}`,
      );
    }
    const legacy = new RegExp(
      `(?<![\\w/.:])/(?:${names.join("|")})(?![\\w/.-])`,
      "g",
    );
    assert.doesNotMatch(
      text,
      legacy,
      "use /skill:name instead of Claude-style slash commands",
    );
    for (const match of text.matchAll(
      /references\/[a-zA-Z0-9_./-]+\.(?:md|css|js|html|py)\b/g,
    )) {
      const target = resolve(dirname(path), match[0]);
      assert.ok(existsSync(target), `missing bundled reference: ${match[0]}`);
    }
  });
}

await test("all 16 supporting files remain bundled", () => {
  const files = filesIn(join(root, "skills"));
  assert.equal(files.length, 34);
  assert.equal(files.filter((path) => !path.endsWith("/SKILL.md")).length, 16);
});

await test("optional connectors and deck dependencies are explicit", () => {
  for (const name of [
    "blueprint",
    "journey",
    "organize",
    "wireframe",
    "present",
  ]) {
    const text = skills.find((skill) => skill.name === name).text;
    assert.ok(text.includes("Discover the actual tool names before writing"));
    assert.ok(
      text.includes("If unavailable, explain and ask before switching formats"),
    );
  }
  const present = skills.find((skill) => skill.name === "present").text;
  assert.ok(
    present.includes(
      'python3 "$SKILL_DIR/references/build_deck.py" deck.json <slug>.pptx',
    ),
  );
  assert.ok(present.includes("ask before installing it"));
  assert.ok(present.includes("internet access is required"));
  assert.ok(present.includes("Never build before approval"));
  const intent = skills.find((skill) => skill.name === "intent").text;
  assert.ok(intent.includes("first read this skill if it has not been loaded"));
  assert.ok(
    intent.includes(
      "Automatic loading for a related task does not require the banner",
    ),
  );
});

await test("bundled Markdown references contain no legacy Intent commands", () => {
  const legacy = new RegExp(
    `(?<![\\w/.:])/(?:${names.join("|")})(?![\\w/.-])`,
    "g",
  );
  for (const path of filesIn(join(root, "skills")).filter((path) =>
    path.endsWith(".md"),
  )) {
    assert.doesNotMatch(readFileSync(path, "utf8"), legacy, path);
  }
});
