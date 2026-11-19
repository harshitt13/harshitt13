const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { formatPostContent, updateReadmes, validatePost } = require("./linkedin");
const post = { text: 'Tracing <systems> & "APIs" $&', url: "https://www.linkedin.com/posts/harshitt13_example" };

test("escapes external text and rejects misleading post links", () => {
  const html = formatPostContent(post);
  assert.ok(html.includes("&lt;systems&gt; &amp; &quot;APIs&quot; $&amp;"));
  for (const url of ["https://linkedin.com.evil.test/posts/a", "javascript:alert(1)", "https://linkedin.com/in/harshitt13", "https://linkedin.com/login"]) {
    assert.throws(() => validatePost({ ...post, url }));
  }
  assert.throws(() => validatePost({ ...post, text: " " }));
});

test("updates both files, preserves surrounding text, and allows repeated runs", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "linkedin-readme-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const original = "Before\n<!--START_SECTION:linkedin-->old<!--END_SECTION:linkedin-->\nAfter";
  const files = ["README.md", "README1.md"];
  for (const file of files) fs.writeFileSync(path.join(root, file), original);
  const html = formatPostContent(post);
  updateReadmes(html, files, root);
  updateReadmes(html, files, root);
  for (const file of files) {
    const actual = fs.readFileSync(path.join(root, file), "utf8");
    assert.ok(actual.startsWith("Before\n"));
    assert.ok(actual.endsWith("\nAfter"));
    assert.ok(actual.includes(html));
  }
  fs.writeFileSync(path.join(root, "README1.md"), "Missing markers");
  const before = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.throws(() => updateReadmes("replacement", files, root));
  assert.equal(fs.readFileSync(path.join(root, "README.md"), "utf8"), before);
});
