# Profile integration setup

## LinkedIn

The updater writes the same post to `README.md` and `README1.md`, between these markers:

```html
<!--START_SECTION:linkedin-->
<!--END_SECTION:linkedin-->
```

Run **Actions > Update LinkedIn Post > Run workflow**. Public post lookup runs daily at 09:00 UTC. LinkedIn may require sign-in or block automated requests, so public lookup is best effort. A failed lookup leaves existing content intact and reports a failed workflow. A live local check on November 19, 2026 reached the page but timed out waiting for a public post card; automatic fetching is not confirmed working for this profile.

For a reliable manual update, provide both `post_url` (an HTTPS LinkedIn post link) and `post_text` (the excerpt to display). This path does not launch a browser or require LinkedIn credentials. Inputs are passed as environment variables and the excerpt is HTML-escaped before insertion.

Local usage, after `npm ci`:

```powershell
$env:LINKEDIN_POST_URL = 'https://www.linkedin.com/posts/your-post-link'
$env:LINKEDIN_POST_TEXT = 'Your post excerpt'
npm run update:linkedin
```

For automatic public lookup, clear those two variables, optionally set `LINKEDIN_USERNAME`, and install Chromium with `npx playwright install chromium` before running the script.

Run regression checks with `node --test scripts/linkedin.test.js`.

The workflow requests `contents: write` and commits both README files to the default branch. Repository rules that prohibit bot pushes may require a pull request instead. Hosted operation is only verified after pushing and running the workflow.

## Spotify

The card uses [spotify-github-profile](https://github.com/kittinan/spotify-github-profile). On November 19, 2026, the existing card endpoint returned an invalid or revoked Spotify token error, even with HTTP status 200.

1. Open the service's [Connect with Spotify page](https://spotify-github-profile.kittinanx.com/api/login).
2. Sign in to the Spotify account you want to display and authorize the service yourself.
3. Use the generated card URL if it differs from the one in `README1.md`.
4. Play a track and check that the card URL returns an image, rather than an error message.

`show_offline=true` lets the service show recent listening while you are offline. It does not repair revoked authorization. Clicking the card opens `https://www.last.fm/user/harshitt13`. Separate Spotify profile and Last.fm listening-history links remain below it.

Do not put Spotify tokens or credentials in either README or GitHub workflow.

The default card uses your supplied URL with a dark background (`121212`), green equalizer bars (`53b14f`), and album artwork. It requests current playback while Spotify is playing and uses offline display when playback stops. GitHub serves README images through its image cache, so the card is not a continuously updating player: reload the profile to request an updated image, and allow for caching delays.
