const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

// Configuration
const LINKEDIN_PROFILE_USERNAME = process.env.LINKEDIN_USERNAME || "harshitt13";
const LINKEDIN_PROFILE_URL = `https://www.linkedin.com/in/${LINKEDIN_PROFILE_USERNAME}/recent-activity/all/`;
const README_PATH = path.join(__dirname, "..", "README.md");
const MAX_RETRIES = 3;
const TIMEOUT = 30000;

/**
 * Scrape latest LinkedIn post from profile activity page
 */
async function getLatestLinkedInPost() {
  let browser;
  try {
    console.log(`🔍 Launching browser and navigating to ${LINKEDIN_PROFILE_URL}...`);
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set user agent to avoid LinkedIn blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to profile with timeout
    await page.goto(LINKEDIN_PROFILE_URL, {
      waitUntil: "networkidle",
      timeout: TIMEOUT,
    });

    console.log("⏳ Waiting for posts to load...");

    // Wait for post content to be visible
    try {
      await page.waitForSelector('[data-id^="urn:li:activity"], article', {
        timeout: TIMEOUT,
      });
    } catch (e) {
      console.warn("⚠️  Post selector not found, attempting alternative selectors...");
    }

    // Extract post information
    const postData = await page.evaluate(() => {
      // Try multiple selectors for robustness
      const postSelectors = [
        'article[data-urn*="activity"]',
        'div[data-id^="urn:li:activity"]',
        "article",
      ];

      let postElement = null;
      for (const selector of postSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          postElement = element;
          break;
        }
      }

      if (!postElement) {
        return null;
      }

      // Extract post text
      const textSelectors = [
        "p, span[dir='ltr'], div.break-words",
        "p:first-of-type",
        "[class*='break-words']",
      ];

      let postText = "";
      for (const selector of textSelectors) {
        const element = postElement.querySelector(selector);
        if (element && element.textContent.trim().length > 0) {
          postText = element.textContent.trim();
          break;
        }
      }

      // Extract post URL
      let postUrl = "";
      const linkElement = postElement.querySelector("a[href*='/feed/']")
        || postElement.querySelector("a[href*='/activity/']")
        || postElement.querySelector("a");
      if (linkElement) {
        postUrl = linkElement.getAttribute("href");
      }

      // Ensure absolute URL
      if (postUrl && !postUrl.startsWith("http")) {
        postUrl = "https://www.linkedin.com" + postUrl;
      }

      return {
        text: postText,
        url: postUrl,
      };
    });

    await context.close();
    await browser.close();

    if (!postData || !postData.text) {
      throw new Error("Could not extract post text from LinkedIn profile.");
    }

    console.log("✅ Successfully fetched LinkedIn post");
    return postData;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Format post for README
 */
function formatPostContent(postData) {
  const { text, url } = postData;
  const truncatedText = text.length > 150 ? text.substring(0, 150) + "..." : text;
  const postTitle = text.split("\n")[0].substring(0, 60);

  const content = `
<div align="center">
  <p align="center">
    <strong>🔗 Latest LinkedIn Post</strong><br><br>
    <a href="${url}" target="_blank" rel="noopener noreferrer">
      <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
  </p>
  <p align="center" style="font-size: 14px; max-width: 500px;">
    <em>${truncatedText}</em>
  </p>
  <p align="center">
    <a href="${url}" target="_blank" rel="noopener noreferrer">Read full post →</a>
  </p>
</div>
`;

  return content;
}

/**
 * Update README with latest post
 */
async function updateReadme(postContent) {
  console.log("📝 Updating README.md...");

  const readme = fs.readFileSync(README_PATH, "utf8");

  // Replace content between markers
  const updated = readme.replace(
    /<!--START_SECTION:linkedin-->[\s\S]*?<!--END_SECTION:linkedin-->/,
    `<!--START_SECTION:linkedin-->${postContent}<!--END_SECTION:linkedin-->`
  );

  // Check if replacement was made
  if (updated === readme) {
    throw new Error(
      "LinkedIn section markers not found in README.md. Ensure markers exist: <!--START_SECTION:linkedin--> and <!--END_SECTION:linkedin-->"
    );
  }

  fs.writeFileSync(README_PATH, updated);
  console.log("✅ README.md updated successfully");
}

/**
 * Main execution with retry logic
 */
async function main() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n📌 Attempt ${attempt}/${MAX_RETRIES}...\n`);
      const postData = await getLatestLinkedInPost();
      const formattedContent = formatPostContent(postData);
      await updateReadme(formattedContent);
      console.log("\n🎉 LinkedIn README update completed successfully!\n");
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Waiting 10 seconds before retry...\n`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  console.error(
    `\n❌ Failed after ${MAX_RETRIES} attempts. Last error: ${lastError.message}\n`
  );
  process.exit(1);
}

main();