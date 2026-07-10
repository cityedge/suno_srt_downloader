/*!
 * Suno SRT Downloader v1.0.3
 * Copyright (c) 2026 cityedge
 * SPDX-License-Identifier: MIT
 *
 * Based in part on suno-line-srt-bookmarklet by kuwa2005.
 * Original portions are MIT-licensed. See THIRD_PARTY_NOTICES.md.
 */
(async function sunoSrtDownloader() {
  'use strict';

  const VERSION = '1.0.3';
  const SETTINGS = {
    startOffset: -0.1,
    endPadding: 1.5,
    maxExtension: 0.4,
    gap: 0,
    minDuration: 0.1
  };
  const JA = /^ja\b/i.test(navigator.language || '');
  const MESSAGES = JA ? {
    wrongPage: 'Sunoの曲ページで実行してください。',
    login: 'Sunoへのログインが必要です。',
    api: 'Suno APIエラー',
    noLyrics: '出力できる歌詞行がありません。',
    error: 'エラー'
  } : {
    wrongPage: 'Run this on a Suno song page.',
    login: 'You must be signed in to Suno.',
    api: 'Suno API error',
    noLyrics: 'No lyric lines are available for export.',
    error: 'Error'
  };

  function finiteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function roundMillis(value) {
    return Math.round(value * 1000) / 1000;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function median(values) {
    const valid = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!valid.length) return 2;
    const middle = Math.floor(valid.length / 2);
    return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2;
  }

  function sanitizeText(value) {
    return String(value || '')
      .replace(/\r/g, '')
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanLeadingTags(value) {
    let text = sanitizeText(value);
    while (/^\s*\[[^\]\r\n]*\]\s*/.test(text)) {
      text = text.replace(/^\s*\[[^\]\r\n]*\]\s*/, '');
    }
    return text.trim();
  }

  function getRawText(line) {
    if (typeof line?.text === 'string' && line.text) return line.text;
    if (typeof line?.word === 'string' && line.word) return line.word;
    if (Array.isArray(line?.words)) {
      return line.words.map((word) => word?.text ?? word?.word ?? '').join('');
    }
    return '';
  }

  function extractDuration(payload) {
    const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
    const candidates = [
      payload?.duration_s,
      payload?.duration,
      payload?.metadata?.duration,
      payload?.metadata?.duration_s,
      root?.duration_s,
      root?.duration,
      root?.metadata?.duration,
      root?.metadata?.duration_s
    ];
    for (const candidate of candidates) {
      const number = finiteNumber(candidate);
      if (number !== null && number > 0) return number;
    }
    return null;
  }

  function extractRawLines(payload) {
    if (Array.isArray(payload?.aligned_lyrics)) return payload.aligned_lyrics;
    if (Array.isArray(payload?.data?.aligned_lyrics)) return payload.data.aligned_lyrics;
    return [];
  }

  function isLikelyInstructionLine(text, section, start, end) {
    const value = sanitizeText(text);
    const match = value.match(/^(?:\((.*)\)|（(.*)）)$/);
    if (!match) return false;
    const inner = sanitizeText(match[1] ?? match[2] ?? '');
    const latinWords = inner.match(/[A-Za-z][A-Za-z0-9'’\-]*/g) || [];
    if (latinWords.length < 3) return false;
    const sectionCue = /(?:interlude|instrumental|break|solo|drop|build(?:-?up)?|transition|intro|outro|間奏|インスト)/i.test(section || '');
    const promptMatches = inner.match(/(?:tempo|beat|trance|house|techno|rhythm|synth|pads?|mix|production|delivery|vocal|drums?|bass|guitar|piano|ambient|cinematic|tribal|organic|warm|deep|uptempo|downtempo|mid-tempo|melodic|groove|texture|arrangement)/gi) || [];
    const promptCue = promptMatches.length >= 2;
    const duration = start !== null && end !== null && end > start ? end - start : null;
    const compressed = duration !== null && latinWords.length >= 5 && duration <= Math.max(0.6, latinWords.length * 0.08);
    return promptCue || compressed || (sectionCue && promptMatches.length >= 1);
  }

  function normalizeLines(payload) {
    const lines = [];
    extractRawLines(payload).forEach((line) => {
      const text = cleanLeadingTags(getRawText(line));
      if (!text) return;
      const words = Array.isArray(line?.words) ? line.words : [];
      const wordStarts = words.map((word) => finiteNumber(word?.start_s)).filter((value) => value !== null);
      const wordEnds = words.map((word) => finiteNumber(word?.end_s)).filter((value) => value !== null);
      const lineStart = finiteNumber(line?.start_s);
      const lineEnd = finiteNumber(line?.end_s);
      const section = sanitizeText(line?.section || '');
      if (isLikelyInstructionLine(text, section, lineStart, lineEnd)) return;
      lines.push({
        text,
        lineStart,
        lineEnd,
        wordStart: wordStarts.length ? Math.min(...wordStarts) : null,
        wordEnd: wordEnds.length ? Math.max(...wordEnds) : null
      });
    });
    return { lines, duration: extractDuration(payload) };
  }

  function scoreTimingSource(lines, type, source) {
    const key = source === 'words'
      ? (type === 'start' ? 'wordStart' : 'wordEnd')
      : (type === 'start' ? 'lineStart' : 'lineEnd');
    let valid = 0;
    let breaks = 0;
    let previous = null;
    lines.forEach((line) => {
      const value = line[key];
      if (value === null) return;
      valid += 1;
      if (previous !== null && value + 0.001 < previous) breaks += 1;
      previous = value;
    });
    return { valid, breaks, ratio: valid / Math.max(lines.length, 1) };
  }

  function resolveSource(lines, type) {
    const words = scoreTimingSource(lines, type, 'words');
    const line = scoreTimingSource(lines, type, 'line');
    if (words.ratio >= 0.7 && words.breaks <= 1) return 'word';
    if (line.valid > 0) return 'line';
    return 'word';
  }

  function pickTiming(line, type, preference) {
    const wordValue = type === 'start' ? line.wordStart : line.wordEnd;
    const lineValue = type === 'start' ? line.lineStart : line.lineEnd;
    const preferred = preference === 'line' ? lineValue : wordValue;
    const fallback = preference === 'line' ? wordValue : lineValue;
    return preferred ?? fallback ?? null;
  }

  function adjustTimings(normalized) {
    const lines = normalized.lines;
    const durations = lines.map((line) => {
      const start = line.wordStart ?? line.lineStart;
      const end = line.wordEnd ?? line.lineEnd;
      return start !== null && end !== null && end > start ? end - start : null;
    }).filter((value) => value !== null && value > 0 && value < 30);
    const fallbackDuration = clamp(median(durations), 0.5, 8);
    const startSource = resolveSource(lines, 'start');
    const endSource = resolveSource(lines, 'end');
    const rawStarts = lines.map((line) => pickTiming(line, 'start', startSource));
    const rawEnds = lines.map((line) => pickTiming(line, 'end', endSource));
    const starts = [];
    let previousStart = -0.001;

    for (let index = 0; index < lines.length; index += 1) {
      let start = rawStarts[index];
      if (start === null) {
        let nextKnown = null;
        for (let next = index + 1; next < rawStarts.length; next += 1) {
          if (rawStarts[next] !== null) {
            nextKnown = rawStarts[next] + SETTINGS.startOffset;
            break;
          }
        }
        start = index === 0 && nextKnown !== null
          ? Math.max(0, nextKnown - fallbackDuration)
          : Math.max(0, previousStart + Math.max(SETTINGS.minDuration, 0.5));
      } else {
        start += SETTINGS.startOffset;
      }
      start = Math.max(0, start);
      if (start < previousStart) start = previousStart + 0.001;
      starts.push(roundMillis(start));
      previousStart = start;
    }

    return lines.map((line, index) => {
      const start = starts[index];
      const nextStart = index + 1 < starts.length ? starts[index + 1] : null;
      const nextLimit = nextStart === null ? null : nextStart - SETTINGS.gap;
      const sourceStart = rawStarts[index];
      let baseEnd = rawEnds[index];
      if (baseEnd === null || (sourceStart !== null && baseEnd <= sourceStart) || baseEnd <= start) {
        baseEnd = nextStart !== null && nextStart > start ? nextStart : start + fallbackDuration;
      }
      let end = baseEnd + SETTINGS.endPadding;
      if (nextLimit !== null) {
        const remaining = nextLimit - end;
        if (end > nextLimit || (remaining >= 0 && remaining <= SETTINGS.maxExtension)) end = nextLimit;
      }
      if (end < start + SETTINGS.minDuration) end = start + SETTINGS.minDuration;
      if (nextLimit !== null && end > nextLimit) end = nextLimit;
      if (end <= start) end = start + 0.02;
      if (normalized.duration !== null && index === lines.length - 1) {
        end = Math.min(end, normalized.duration);
        if (end <= start) end = start + 0.02;
      }
      return { text: line.text, start, end: roundMillis(end) };
    });
  }

  function formatSrtTime(seconds) {
    const totalMs = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  function buildSrt(lines) {
    return lines.map((line, index) =>
      `${index + 1}\r\n${formatSrtTime(line.start)} --> ${formatSrtTime(line.end)}\r\n${line.text}\r\n`
    ).join('\r\n');
  }

  function extractSongTitle(payload) {
    const roots = [];
    const push = (value) => {
      if (value && typeof value === 'object') roots.push(value);
    };
    if (Array.isArray(payload)) push(payload[0]);
    else push(payload);
    push(payload?.data);
    push(payload?.clip);
    push(payload?.data?.clip);
    push(payload?.metadata);
    push(payload?.data?.metadata);
    push(payload?.clip?.metadata);
    push(payload?.data?.clip?.metadata);
    for (const root of roots) {
      for (const key of ['title', 'display_name', 'song_name', 'name']) {
        const value = root?.[key];
        if (typeof value === 'string' && sanitizeText(value)) return sanitizeText(value);
      }
    }
    return '';
  }

  function getPageSongTitle() {
    const candidates = [
      document.querySelector('meta[property="og:title"]')?.content,
      document.querySelector('meta[name="twitter:title"]')?.content,
      document.title
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const cleaned = sanitizeText(candidate)
        .replace(/\s*[|｜]\s*Suno\s*$/i, '')
        .replace(/\s*[-–—]\s*Suno\s*$/i, '')
        .trim();
      if (cleaned && !/^suno$/i.test(cleaned)) return cleaned;
    }
    return '';
  }

  function sanitizeFileName(value, fallback) {
    let name = sanitizeText(value || '')
      .replace(/\.srt$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/[. ]+$/g, '')
      .trim();
    if (!name) name = fallback;
    if (/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(name)) name = `_${name}`;
    if (name.length > 180) name = name.slice(0, 180).replace(/[. ]+$/g, '').trim();
    return name || fallback;
  }

  function downloadText(fileName, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function getSongId() {
    return location.pathname.match(/\/(?:song|edit)\/([0-9a-f-]{36})(?:\/|$)/i)?.[1] || null;
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (let index = parts.length - 1; index >= 0; index -= 1) {
      const part = parts[index].trim();
      if (part.startsWith(prefix)) return part.slice(prefix.length);
    }
    return null;
  }

  try {
    const songId = getSongId();
    if (!songId) return alert(MESSAGES.wrongPage);
    const token = getCookie('__session');
    if (!token) return alert(MESSAGES.login);

    const previousCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = 'wait';
    let lyricsResponse;
    let clipPayload = null;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      [lyricsResponse, clipPayload] = await Promise.all([
        fetch(`https://studio-api.prod.suno.com/api/gen/${songId}/aligned_lyrics/v2/`, { headers }),
        fetch(`https://studio-api.prod.suno.com/api/clip/${songId}`, { headers })
          .then(async (response) => response.ok ? response.json() : null)
          .catch(() => null)
      ]);
    } finally {
      document.documentElement.style.cursor = previousCursor;
    }

    if (!lyricsResponse.ok) return alert(`${MESSAGES.api}: ${lyricsResponse.status}`);
    const payload = await lyricsResponse.json();
    const normalized = normalizeLines(payload);
    if (normalized.duration === null) normalized.duration = extractDuration(clipPayload);
    if (!normalized.lines.length) return alert(MESSAGES.noLyrics);
    const lines = adjustTimings(normalized);
    if (!lines.length) return alert(MESSAGES.noLyrics);
    const title = extractSongTitle(clipPayload) || extractSongTitle(payload) || getPageSongTitle() || songId;
    downloadText(`${sanitizeFileName(title, songId)}.srt`, buildSrt(lines));
  } catch (error) {
    alert(`${MESSAGES.error}: ${error?.message || String(error)}`);
  }
}());
