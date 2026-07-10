# Suno SRT Downloader v1.0.3

Sunoの曲ページでクリックすると、Sunoの同期歌詞を取得し、字幕向けの固定補正を適用して、`曲名.srt`をすぐにダウンロードするブックマークレットです。設定画面はありません。SRT Tap Timerなどで最終修正するための初期SRT作成を目的としています。

Suno SRT Downloader is a one-click bookmarklet that retrieves Suno's aligned lyrics, applies fixed subtitle-oriented timing corrections, and immediately downloads `Song title.srt`.

## 重要 / Important

> **曲の生成後、Suno上で歌詞を編集するとその都度、同期タイミングが再構成されます。タイミングの精度は基本的に再構成のたびに下がります。歌詞を一度も編集していない状態で実行するようにしてください。**
>
> **After a song is generated, each lyrics edit in Suno rebuilds the synchronization timing. Timing accuracy generally decreases with each rebuild. Run this tool before the lyrics have been edited even once.**

## 固定設定

| 項目 | 値 |
|---|---:|
| 開始補正 | -0.10秒 |
| 終了余韻 | +1.50秒 |
| 次行まで延長する最大時間 | 0.40秒 |
| 字幕間ギャップ | 0.00秒 |
| 最低表示時間 | 0.10秒 |
| 次字幕との重なり防止 | 有効 |
| 明らかなSuno指示行 | 自動除外 |

行内単語時刻を優先し、利用状況が悪い場合は行時刻を使用します。

## インストールと使い方

1. `index.html`をChrome / Edgeで開きます。
2. `Suno → SRT`をブックマークバーへドラッグします。
3. Sunoへログインし、歌詞を一度も編集していない対象曲の`/song/...`または`/edit/...`ページを開きます。
4. `Suno → SRT`をクリックします。
5. 正常時は画面を表示せず、`曲名.srt`がダウンロードされます。

## ファイル

- `index.html` — インストールページ / GitHub Pages
- `USER_GUIDE.md` — 使用方法、固定設定、注意事項
- `CHANGELOG.md` — 変更履歴
- `LICENSE` — cityedgeによる本プロジェクトのMITライセンス
- `THIRD_PARTY_NOTICES.md` — 派生元の著作権表示とMITライセンス全文
- `suno_srt_downloader.js` — 非圧縮ソース
- `suno_srt_downloader.compact.js` — 1行圧縮ソース
- `bookmarklet.txt` — URLエンコード済みブックマークレットURL

## 推奨環境

Windows上の最新Google ChromeまたはMicrosoft Edge。

## 注意

- Sunoとは無関係の非公式ツールです。
- Sunoの非公開APIに依存し、仕様変更で動作しなくなる可能性があります。
- 元の同期データが大きく誤っている行は自動修復できません。
- 出力後は音源を再生し、SRT Tap Timer等で確認してください。

## License

New code and modifications are Copyright (c) 2026 cityedge and licensed under the MIT License. Portions are based on `suno-line-srt-bookmarklet` by kuwa2005, also licensed under MIT. See `THIRD_PARTY_NOTICES.md`.
