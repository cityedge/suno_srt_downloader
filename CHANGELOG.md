# Changelog

## v1.1.0 — 2026-07-11

- Added the fixed abnormal token-interval repair validated in Suno SRT Timing Adjuster v0.5.0.
- Scans every adjacent token pair and treats the larger of the start-time and end-time differences as the interval.
- Compresses the largest interval above 3.0 seconds to 1.5 seconds.
- Repairs the start side for the first actual lyric after a metadata tag and the end side for other lines.
- Keeps the public tool one-click: no settings dialog and no new user-adjustable parameters.
- Documents that the heuristic reduces severe errors but may leave several seconds of residual error.

## v1.0.3 — 2026-07-10

- Finalized the GitHub-ready release package.
- Replaced the installer warning with the confirmed wording about alignment rebuilding after every lyrics edit.
- Added concise bilingual README and user guide.
- Separated the project MIT license from the original project's copyright and MIT notice.
- Added source-file attribution headers.
- Kept the download and timing logic unchanged from v1.0.2.

## v1.0.2

- URL-encoded the full bookmarklet body to prevent URL parsing from corrupting JavaScript `%` operators and other characters.

## v1.0.1

- Removed unsafe line breaks from the bookmarklet URL.

## v1.0.0

- First fixed-parameter, one-click downloader candidate.
