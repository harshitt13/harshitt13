# LinkedIn Post Auto-Updater Setup Guide

This project automatically fetches your latest LinkedIn post and displays it in your README using Playwright web scraping.

## 🚀 Quick Start

### Prerequisites
- GitHub repository (you're already here!)
- GitHub Actions enabled (default for public repos)
- Node.js 20+ (for local testing)

### Step 1: Update Your LinkedIn Username

Edit `.github/workflows/linkedin.yml` and replace the default username:

```yaml
env:
  LINKEDIN_USERNAME: your-linkedin-username  # Change 'harshitt13' to your username
```

Or you can manually trigger the workflow from GitHub Actions UI and provide a username.

### Step 2: Verify README Markers

Ensure your README.md contains the update section markers:

```html
<!--START_SECTION:linkedin-->
<p align="center">LinkedIn post updates will appear here.</p>
<!--END_SECTION:linkedin-->
```

Your README already has these markers in the first row, second column.

### Step 3: Push Changes

```bash
git add .
git commit -m "feat: add LinkedIn auto-updater"
git push
```

### Step 4: Enable Workflow

1. Go to your repo on GitHub
2. Click **Actions** tab
3. Find **"Update LinkedIn Post"** workflow
4. Click **"Run workflow"** → **"Run workflow"** button
5. Monitor the execution

## 📋 Configuration

### LinkedIn Profile URL
The script looks for your LinkedIn profile at:
```
https://www.linkedin.com/in/YOUR_USERNAME/recent-activity/all/
```

Replace `YOUR_USERNAME` with your LinkedIn profile slug (the part in your profile URL after `/in/`).

### Schedule
Currently set to run **every 6 hours**:
```yaml
- cron: "0 */6 * * *"  # UTC timezone
```

To change the schedule, edit `.github/workflows/linkedin.yml` and modify the cron expression:
- `0 0 * * *` - Every day at midnight UTC
- `0 9 * * MON` - Every Monday at 9 AM UTC
- `0 */12 * * *` - Every 12 hours

[Cron expression helper](https://crontab.guru/)

## 🔧 Local Testing

Test the script locally before relying on GitHub Actions:

```bash
# Install dependencies
npm install

# Set your LinkedIn username
export LINKEDIN_USERNAME=your-linkedin-username

# Run the script
npm run update:linkedin
```

## ⚙️ How It Works

1. **Playwright launches a headless browser** and navigates to your LinkedIn profile activity page
2. **Extracts the latest post** including text and URL
3. **Formats it beautifully** in markdown with emoji, badges, and a clickable link
4. **Updates README.md** between the section markers
5. **Auto-commits and pushes** changes back to your repo

## 🎨 Output Format

The script generates formatted output like:

```markdown
<div align="center">
  <p align="center">
    <strong>🔗 Latest LinkedIn Post</strong><br><br>
    <a href="LINKEDIN_POST_URL" target="_blank" rel="noopener noreferrer">
      <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
  </p>
  <p align="center" style="font-size: 14px; max-width: 500px;">
    <em>Your post text here...</em>
  </p>
  <p align="center">
    <a href="LINKEDIN_POST_URL" target="_blank" rel="noopener noreferrer">Read full post →</a>
  </p>
</div>
```

## 🆘 Troubleshooting

### Workflow Fails with "Post not found"
- **Ensure your LinkedIn profile is public** and accessible without login
- Check that you have recent activity on your profile
- Verify the username in the workflow is correct

### GitHub Actions Reports Browser Launch Error
- The workflow automatically installs Playwright dependencies via `npx playwright install --with-deps chromium`
- This is included in the workflow, so it should work out of the box

### README Not Updating
1. Check that the section markers exist in README.md:
   ```html
   <!--START_SECTION:linkedin-->
   <!--END_SECTION:linkedin-->
   ```
2. Run the workflow manually from GitHub Actions tab
3. Check the workflow logs for error messages

### LinkedIn Account Locked / Flagged
- LinkedIn may block automated access if it detects suspicious activity
- Use the `workflow_dispatch` trigger sparingly
- Consider increasing the time interval (e.g., 12 hours instead of 6 hours)
- Ensure your LinkedIn account is not restricted

## 📚 Environment Variables

The script respects these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LINKEDIN_USERNAME` | `harshitt13` | Your LinkedIn profile username |

## 🔐 Privacy & Security

- ✅ No credentials stored (uses public profile page)
- ✅ No sensitive data logged
- ✅ GitHub Actions tokens are automatically managed
- ✅ Script runs in a containerized environment

## 📝 Files Overview

```
.github/
└── workflows/
    └── linkedin.yml           # GitHub Action workflow definition
scripts/
└── linkedin.js               # Main scraping script
package.json                  # Node dependencies
LINKEDIN_SETUP.md            # This file
```

## 🚀 Advanced Usage

### Manual Trigger with Custom Username

From GitHub Actions UI:
1. Go to **Actions** tab
2. Select **"Update LinkedIn Post"** workflow
3. Click **"Run workflow"** 
4. Enter your LinkedIn username
5. Click **"Run workflow"**

### Modify Output Format

Edit `scripts/linkedin.js` → `formatPostContent()` function to customize the markdown output.

### Add Emoji/Icons

The script already includes LinkedIn badge. You can add more by editing the `formatPostContent()` function:

```javascript
// Example: Add custom emoji
const content = `🚀 [${postTitle}](${url})`
```

## 📞 Support

If you encounter issues:
1. Check the **Workflow Logs** in GitHub Actions
2. Run locally with `npm run update:linkedin` to test
3. Verify LinkedIn username is correct
4. Ensure section markers exist in README.md

## 📄 License

MIT - Use freely!

---

**Happy auto-updating!** 🎉
