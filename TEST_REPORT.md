# Suno SRT Downloader v1.2.0 Test Report

Test date: 2026-09-16

## Release specification

Public v1.2.0 adds one user-adjustable parameter only: the subtitle start offset.

Selectable start offsets:

- 0.0 seconds
- -0.1 seconds (default)
- -0.2 seconds
- -0.3 seconds
- -0.4 seconds
- -0.5 seconds

The value selected when the user presses Download is saved under the Suno origin in `localStorage` with key:

`cityedge.sunoSrtDownloader.startOffset`

If browser storage is unavailable or contains an invalid value, the default remains -0.1 seconds. All other public timing parameters are unchanged from v1.1.0:

- end padding: +1.50 seconds
- maximum extension to the next subtitle: 0.40 seconds
- subtitle gap: 0.00 seconds
- minimum duration: 0.10 seconds
- abnormal token-interval threshold: 3.0 seconds
- interval retained after repair: 1.5 seconds

The v1.1.0 abnormal token-interval repair logic is unchanged.

## Dialog behavior

Confirmed in the DOM integration harness:

- the bookmarklet creates a small modal dialog on a valid Suno song page
- the dialog contains exactly six start-offset options: `0,-0.1,-0.2,-0.3,-0.4,-0.5`
- a fresh profile selects `-0.1` by default
- pressing Download persists the selected value
- a subsequent invocation restores the saved value
- an invalid saved value falls back to `-0.1`
- the readable source and compact bookmarklet source produce identical SRT output

The dialog also supports closing without download through the close button, backdrop click, or Escape; Enter submits the currently selected value.

## Exact v1.1.0 parity at the default setting

With v1.2.0 set to `-0.1` seconds, output was compared byte-for-byte with public v1.1.0 across these seven aligned-lyrics datasets:

- `before.json`
- `after.json`
- `rewound.json`
- `before2.json`
- `after2.json`
- raw JSON for `雨あがりの合図`
- raw JSON for `青い影のルーパー feat. ReflecTesla ver. 2`

Result: all seven SRT outputs matched exactly.

Therefore the new release changes no timing behavior when the user leaves the start offset at its default value.

## Variable-offset confirmation

Using the raw JSON for `雨あがりの合図`, start offset `-0.3` seconds produced subtitle 25 as:

```text
25
00:02:01,551 --> 00:02:04,009
濡れた街路樹が
```

The corresponding v1.1.0 / v1.2.0 default (`-0.1`) timing is:

```text
25
00:02:01,751 --> 00:02:04,209
濡れた街路樹が
```

This confirms that the selected start offset participates in the normal downstream overlap and end-clipping logic, rather than being applied only as a cosmetic post-processing shift.

## Bookmarklet/package checks

Passed:

- readable JavaScript syntax check with Node.js
- one-line compact JavaScript syntax check with Node.js
- full URL encoding of the bookmarklet body
- no CR or LF characters in `bookmarklet.txt`
- decoding `bookmarklet.txt` reproduces `suno_srt_downloader.compact.js` exactly
- the bookmarklet embedded in `index.html` matches `bookmarklet.txt` exactly
- mocked Suno song page / session cookie / aligned-lyrics API / clip API / Blob / download-anchor integration
- v1.1.0 parity across seven datasets at the default `-0.1` setting
- localStorage save, restore, and invalid-value fallback
- SHA-256 manifest verification
- ZIP entries stored at archive root

The generated bookmarklet URL is approximately 29k characters, below the roughly 56k-character advanced bookmarklet that was previously confirmed to work in Chrome in this project.

A native Chrome/Edge run was not performed inside the build container. The JavaScript and DOM behavior were exercised with a deterministic mock-browser integration harness; final real-browser confirmation remains the normal release smoke test after installation.
