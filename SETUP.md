# Profile integration setup

## Spotify

The card uses [spotify-github-profile](https://github.com/kittinan/spotify-github-profile). On November 19, 2026, the existing card endpoint returned an invalid or revoked Spotify token error, even with HTTP status 200.

1. Open the service's [Connect with Spotify page](https://spotify-github-profile.kittinanx.com/api/login).
2. Sign in to the Spotify account you want to display and authorize the service yourself.
3. Use the generated card URL if it differs from the one in `README1.md`.
4. Play a track and check that the card URL returns an image, rather than an error message.

`show_offline=true` lets the service show recent listening while you are offline. It does not repair revoked authorization. Clicking the card opens `https://www.last.fm/user/harshitt13`. 

Do not put Spotify tokens or credentials in either README or GitHub workflow.

The default card uses your supplied URL with a dark background (`121212`), green equalizer bars (`53b14f`), and album artwork. It requests current playback while Spotify is playing and uses offline display when playback stops. GitHub serves README images through its image cache, so the card is not a continuously updating player: reload the profile to request an updated image, and allow for caching delays.

## Dependency updates

`.github/dependabot.yml` checks GitHub Actions dependencies and the banner generator's Pillow dependency every Tuesday at 09:00 India time. Minor and patch GitHub Actions updates are grouped; major updates remain separate for review. Updates arrive as pull requests after the configuration is pushed to the default branch. They are not automatically merged.

## Profile banner

`public/GIF/observability-banner.gif` is an original animation showing a request flowing through an API, service, and storage alongside trace spans. It is stored in this repository and does not require an external image service.

To regenerate it locally, install Pillow if needed and run:

```powershell
python -m pip install -r requirements.txt
python scripts/build_banner.py
```

The generator uses Windows Segoe UI and Consolas fonts, with DejaVu fallbacks on Linux.

