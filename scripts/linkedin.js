const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const MARKERS = /<!--START_SECTION:linkedin-->[\s\S]*?<!--END_SECTION:linkedin-->/;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function validatePost(post) {
  const url = new URL(post.url);
  if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname)
      || !/^\/(posts\/|feed\/update\/urn:li:activity:|activity\/)/.test(url.pathname)) {
    throw new Error("Use an HTTPS LinkedIn post URL, not a profile or sign-in URL.");
  }
  const text = post.text.trim();
  if (!text) throw new Error("Post text is required.");
  return { text, url: url.href };
}

function formatPostContent(input) {
  const { text, url } = validatePost(input);
  const excerpt = text.length > 220 ? `${text.slice(0, 220)}...` : text;
  return `\n<p>${escapeHtml(excerpt).replace(/\r?\n/g, "<br>")}</p>\n<p><a href="${escapeHtml(url)}">Read the post on LinkedIn</a></p>\n`;
}

function updateReadmes(content, files = ["README.md", "README1.md"], root = ROOT) {
  // Validate every target before writing any file.
  const updates = files.map((file) => {
    const filename = path.join(root, file);
    const original = fs.readFileSync(filename, "utf8");
    if (!MARKERS.test(original)) throw new Error(`LinkedIn markers missing in ${file}`);
    const updated = original.replace(MARKERS, () =>
      `<!--START_SECTION:linkedin-->${content}<!--END_SECTION:linkedin-->`);
    return { filename, original, updated };
  });
  for (const { filename, original, updated } of updates) {
    if (original !== updated) fs.writeFileSync(filename, updated);
  }
}

async function getLatestLinkedInPost(username) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`https://www.linkedin.com/in/${encodeURIComponent(username)}/recent-activity/all/`, {
      waitUntil: "domcontentloaded", timeout: 30000,
    });
    const selector = 'article[data-urn*="activity"], [data-id^="urn:li:activity"], .main-feed-activity-card';
    await page.waitForSelector(selector, { timeout: 15000 });
    const post = await page.evaluate((selector) => {
      const card = document.querySelector(selector);
      const text = card.querySelector('.feed-shared-update-v2__description, .attributed-text-segment-list__content, .break-words')?.textContent?.trim();
      let url = card.querySelector('a[href*="/posts/"], a[href*="/feed/update/"], a[href*="/activity/"]')?.href;
      const urn = card.getAttribute("data-urn") || card.getAttribute("data-id");
      if (!url && /^urn:li:activity:\d+$/.test(urn || "")) url = `https://www.linkedin.com/feed/update/${urn}/`;
      return { text: text || "", url: url || "" };
    }, selector);
    return validatePost(post);
  } finally {
    await browser.close();
  }
}

async function main() {
  const url = process.env.LINKEDIN_POST_URL;
  const text = process.env.LINKEDIN_POST_TEXT;
  if (Boolean(url) !== Boolean(text)) throw new Error("Provide both LINKEDIN_POST_URL and LINKEDIN_POST_TEXT.");
  const post = url ? { url, text } : await getLatestLinkedInPost(process.env.LINKEDIN_USERNAME || "harshitt13");
  updateReadmes(formatPostContent(post));
  console.log("LinkedIn sections updated in README.md and README1.md.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`LinkedIn update failed: ${error.message}`);
    console.error("Existing content is preserved if fetching fails. Use the workflow's post_url and post_text inputs if LinkedIn requires sign-in.");
    process.exitCode = 1;
  });
}

module.exports = { formatPostContent, updateReadmes, validatePost };
