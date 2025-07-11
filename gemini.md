 ゲーム開発用コンテキスト設定（AI生成向け）
ゲーム概要
ジャンル: 落下型パズルゲーム

テーマ: フルーツ

モード:
ノーマルモード：ステージ制、目標スコア達成型
スコアアタックモード：60秒スコア競争、固定ステージ
ゲームプレイの要点
フルーツブロックが上から落下
左右移動、回転、ソフト/ハードドロップが可能
同じ種類のフルーツが4つ以上繋がると消える（縦横のみ）
消去後のブロック落下による**連鎖（CHAIN）**あり
消した数や連鎖数に応じてスコア計算（後述）

スコア計算式
基本スコア = レベル * 10 * 消去数
数量ボーナス = 5個以上消去時に加算
連鎖ボーナス = 基本スコア * 2^(連鎖数 - 1)
操作方法（キーボード）
操作キー	機能
← →	横移動
↓	ソフトドロップ
↑ / Space	時計回り回転
D	ハードドロップ
P	一時停止/再開

ゲームUI構成（HTML/CSS/Canvas）
<canvas id="game-board">：メインプレイエリア（300x600）
<div id="info-panel">：スコア・レベルなど表示
<div id="start-screen">：モード選択やハイスコア表示
<div id="how-to-play-screen">：操作説明用画面
<div id="game-top-bar">：時間表示・一時停止
<div id="mobile-controls">：スマホ向け操作ボタン

レベル＆ステージ進行
レベルアップ条件: 消去数32個ごと

レベル上昇で落下速度とスコア倍率が上昇
ノーマルモード: GOALスコア達成で次ステージ
スコアアタックモード: レベル9固定、ステージ固定、制限60秒
視覚演出（Canvas/JSアニメーション）
消去エフェクト（パーティクル）
連鎖ポップアップ（"X CHAIN!"）
レベルアップ表示（"LEVEL UP!" + 光輪）
タイム警告（5.5秒未満で赤点滅）
ハイスコア更新演出

画像
- **フルーツ**: `banana.png`, `cherry.png``blueberry.png``grape.png``melon.png``orange.png``peach.png` など7種類。`30x30`ピクセル。

サウンド（Web Audio API）
効果音種別	ファイル名
着地	land.mp3
消去	clear.mp3
連鎖	chain.mp3
レベルアップ	level_up.mp3
ハイスコア更新	level_up.mp3 (仮)
ステージクリア	clear.mp3 (仮)
BGM	bgm.m4a

技術スタック
HTML5 / CSS3 / JavaScript (ES6+)
Canvas 2D API：描画用
Web Audio API：BGM・効果音再生
localStorage：ハイスコア保存
レスポンシブ対応：スマホプレイ最適化


備考
落下パターンやブロック生成はランダム性を考慮（ランダムシード指定可）
デバッグ用途でログ表示やレベル強制変更機能の有効化も検討可

🧩 コード分割方針（モジュール設計）
📁 ディレクトリ構成（例）
bash
Copy
Edit
project-root/
├── index.html
├── style/
│   └── main.css
├── assets/
│   ├── images/           # フルーツや背景など
│   │          ├── fruits/ # フルーツ
│   │          └──backgrounds # 背景
│   └── sounds/           # 効果音/BGM
├── scripts/
│   ├── main.js           # 初期化・エントリーポイント
│   ├── game/
│   │   ├── gameEngine.js     # ゲームの進行・状態管理
│   │   ├── board.js          # ボード描画・キャンバス操作
│   │   ├── block.js          # ブロックの構造と動作（回転・落下など）
│   │   ├── collision.js      # 衝突判定と接地処理
│   │   ├── matchChecker.js   # 消去判定と連鎖処理
│   │   ├── scoreManager.js   # スコア計算・レベル管理
│   │   ├── timer.js          # 時間管理
│   │   └── effect.js         # パーティクル・連鎖などの視覚エフェクト
│   ├── ui/
│   │   ├── screenManager.js  # スタート・ゲーム・結果画面の切替制御
│   │   ├── panelUpdater.js   # スコアやレベル表示などのUI更新
│   │   ├── inputHandler.js   # キーボード・スマホ操作対応
│   │   └── soundManager.js   # 効果音・BGM管理
│   └── utils/
│       └── helper.js         # 汎用関数、ランダム処理など

🧠 モジュール責任の詳細
モジュール	役割概要
main.js	ゲーム全体の初期化とルート制御。リセットやループの起点。
gameEngine.js	ゲーム状態の遷移、ループ処理（tick/frameごと）、終了判定。
board.js	Canvas 上でのグリッド描画、ブロックの配置管理。
block.js	落下中のブロック定義（形状、回転、位置）。
collision.js	接地・衝突・境界判定などのロジック。
matchChecker.js	消去条件判定（縦横4個以上）、連鎖チェック。
scoreManager.js	スコア・レベル・ステージ・目標スコアの管理。
timer.js	制限時間のカウントと警告タイミング処理。
effect.js	消去・連鎖・レベルアップ等の視覚演出制御。
screenManager.js	スタート・ゲーム・結果・遊び方画面などのDOM表示制御。
panelUpdater.js	スコア/レベルなどUI側のテキスト更新。
inputHandler.js	ユーザー入力の抽象化（キー・スマホ両対応）。
soundManager.js	BGMや効果音の再生、停止、音量調整。
helper.js	ランダム、配列操作、座標変換など共通ユーティリティ。

🛠 補足ポリシー
再利用性を高めるため、UIとロジックは厳密に分離。
**状態管理（ゲームステート）**は gameEngine.js で一元管理。
Canvas描画ロジックとUI表示（DOM）ロジックを完全分離。
タッチ操作とキーボード操作の抽象化層は inputHandler.js に集中。
効果音/視覚エフェクトは全て非同期で処理可能に（requestAnimationFrameなど活用）。
フルーツの形状定義や初期パターンはJSONなど外部定義可能。
🧪 開発補助モジュール（任意）
debugPanel.js：FPSや状態表示をデバッグ用に追加可能。
devConfig.js：難易度、シード固定、強制演出など開発用設定を管理。
