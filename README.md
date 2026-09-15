# Suno SRT Downloader v1.2.0

Sunoの曲ページでクリックすると、小さなダイアログで「開始補正」だけを選択し、Sunoの同期歌詞を取得して字幕向けの補正を適用し、`曲名.srt`をダウンロードするブックマークレットです。SRT Tap Timerなどで最終修正するための初期SRT作成を目的としています。

Suno SRT Downloader is a bookmarklet that shows a small start-offset dialog, retrieves Suno's aligned lyrics, applies subtitle-oriented timing corrections, and downloads `Song title.srt`.

## 重要 / Important

> **曲の生成後、Suno上で歌詞を編集するとその都度、同期タイミングが再構成されます。タイミングの精度は基本的に再構成のたびに下がります。歌詞を一度も編集していない状態で実行するようにしてください。**
>
> **After a song is generated, each lyrics edit in Suno rebuilds the synchronization timing. Timing accuracy generally decreases with each rebuild. Run this tool before the lyrics have been edited even once.**

## ユーザー設定

| 項目 | 選択肢 | 初期値 |
|---|---|---:|
| 開始補正 | 0.0 / -0.1 / -0.2 / -0.3 / -0.4 / -0.5秒 | -0.1秒 |

選択した開始補正はSunoページの`localStorage`へ保存され、次回起動時に復元されます。

## 固定設定

| 項目 | 値 |
|---|---:|
| 終了余韻 | +1.50秒 |
| 次行まで延長する最大時間 | 0.40秒 |
| 字幕間ギャップ | 0.00秒 |
| 最低表示時間 | 0.10秒 |
| 次字幕との重なり防止 | 有効 |
| 明らかなSuno指示行 | 自動除外 |
| 異常トークン間隔の判定 | 3.0秒超 |
| 修復後のトークン間隔 | 1.50秒 |

行内単語時刻を優先し、利用状況が悪い場合は行時刻を使用します。

## 異常トークン間隔修復

v1.1.0で導入した固定ロジックを変更せず継承しています。各歌詞行の隣接トークンについて、開始時刻差と終了時刻差の大きい方を調べ、最大値が3.0秒を超える場合、その異常間隔を1.5秒へ圧縮します。

- メタタグ後の最初の実歌詞行：終了側を維持し、開始を後ろへ移動
- その他の歌詞行：開始側を維持し、終了を前へ移動

この処理は、十数秒以上に伸びた致命的な異常を手修正しやすい範囲へ縮めるための固定ヒューリスティックです。修復後も数秒のずれ、短すぎる表示、長すぎる表示が残る場合があります。

## インストールと使い方

1. `index.html`をChrome / Edgeで開きます。
2. `Suno → SRT`をブックマークバーへドラッグします。
3. Sunoへログインし、歌詞を一度も編集していない対象曲の`/song/...`または`/edit/...`ページを開きます。
4. `Suno → SRT`をクリックします。
5. 小さなダイアログで開始補正を選びます。初回は`-0.1秒`です。
6. `ダウンロード`を押すと`曲名.srt`がダウンロードされます。

## ファイル

- `index.html` — インストールページ / GitHub Pages
- `USER_GUIDE.md` — 使用方法、設定、注意事項
- `CHANGELOG.md` — 変更履歴
- `LICENSE` — cityedgeによる本プロジェクトのMITライセンス
- `THIRD_PARTY_NOTICES.md` — 派生元の著作権表示とMITライセンス全文
- `suno_srt_downloader.js` — 非圧縮ソース
- `suno_srt_downloader.compact.js` — ブックマークレット用1行ソース
- `bookmarklet.txt` — URLエンコード済みブックマークレットURL

## 推奨環境

Windows上の最新Google ChromeまたはMicrosoft Edge。

## 注意

- Sunoとは無関係の非公式ツールです。
- Sunoの非公開APIに依存し、仕様変更で動作しなくなる可能性があります。
- 大きなトークン間隔異常は自動圧縮しますが、元の同期データに正しい時刻がない場合は完全には修復できません。
- 出力後は音源を再生し、SRT Tap Timer等で確認してください。

## License

New code and modifications are Copyright (c) 2026 cityedge and licensed under the MIT License. Portions are based on `suno-line-srt-bookmarklet` by kuwa2005, also licensed under MIT. See `THIRD_PARTY_NOTICES.md`.
