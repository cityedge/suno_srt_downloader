# Suno SRT Downloader v1.1.0 Test Report

Test date: 2026-07-11

## Release specification

The public downloader remains a one-click bookmarklet with no settings dialog. The following values are fixed in the source:

- abnormal token-interval threshold: 3.0 seconds
- interval retained after repair: 1.5 seconds
- start offset: -0.10 seconds
- end padding: +1.50 seconds
- maximum extension to the next subtitle: 0.40 seconds
- subtitle gap: 0.00 seconds
- minimum duration: 0.10 seconds

For each lyric line, every adjacent token pair is inspected. The larger of the start-time difference and end-time difference is treated as that pair's interval. When the largest interval exceeds 3.0 seconds, it is compressed to 1.5 seconds.

- first actual lyric after a metadata tag: move the start later
- all other lyric lines: move the end earlier

## Exact parity with the frozen advanced implementation

The output of public v1.1.0 was compared with the Standard preset of the frozen Suno SRT Timing Adjuster v0.5.0. Text, line count, start time, and end time matched exactly for all lines in these seven datasets:

- `before.json`
- `after.json`
- `rewound.json`
- `before2.json`
- `after2.json`
- raw JSON for `雨あがりの合図`
- raw JSON for `青い影のルーパー feat. ReflecTesla ver. 2`

## Confirmed real-data cases

### Tail-side repair retained

`未知への扉を 今叩くんだ` in the late chorus:

```text
final end: 196.564 seconds
```

### Head-side repair at a section start

`濡れた街路樹が`:

```text
start: 121.751 seconds
end:   124.209 seconds
```

### Internal token-interval repair at a section start

`ガラスに映った 迷う瞳`:

```text
start:  94.943 seconds
end:   102.666 seconds
```

### Earlier edge cases retained

- `ダレもいない タイイッカンノスミ`: start 20.900 seconds
- `マドノムコウ シズんでゆくユーヒ`: start 91.193 seconds, end 96.443 seconds under the frozen v0.5.0 direction rule

## Unit and regression checks

Passed:

- metadata-only lines mark the following actual lyric as the section's first lyric
- a conservatively excluded parenthesized production direction does not consume that marker
- section-first lines receive head-side repair
- other lines receive tail-side repair
- an interval exactly equal to 3.0 seconds is not repaired
- single-token lines are not repaired
- public v1.0.3 and v1.1.0 were compared across seven datasets; every changed output was attributable to a repaired line or adjacent overlap clipping caused by a repaired next-line start

## Bookmarklet and package checks

Passed:

- readable JavaScript syntax check with Node.js
- compact JavaScript syntax check with Node.js
- full URL encoding of the bookmarklet body
- no CR or LF characters in the bookmarklet URL
- decoding `bookmarklet.txt` reproduces `suno_srt_downloader.compact.js` exactly
- the bookmarklet embedded in `index.html` matches `bookmarklet.txt` exactly
- compact bookmarklet integration test with a mocked Suno song page, `__session` cookie, aligned-lyrics API, clip API, Blob, and download anchor
- integration output downloaded as `雨あがりの合図.srt` and contained the expected repaired 25th subtitle
- ZIP entries are stored at the archive root
- SHA-256 manifest verification

A native Chrome/Edge run of public v1.1.0 was not performed inside the build container. The same repair implementation was already tested successfully by the user in the advanced v0.5.0 bookmarklet; automated parity testing confirmed that public v1.1.0 produces identical SRT output.
