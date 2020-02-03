import { GameMainParameterObject, RPGAtsumaruWindow } from "./parameterObject";
import * as b2 from "@akashic-extension/akashic-box2d";

declare const window: RPGAtsumaruWindow;

export function main(param: GameMainParameterObject): void {
	const scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: ["player", "shot", "se", "karaoke", "toomo", "pentagon"]
	});
	let time = 60; // 制限時間
	if (param.sessionParameter.totalTimeLimit) {
		time = param.sessionParameter.totalTimeLimit; // セッションパラメータで制限時間が指定されたらその値を使用します
	}
	// 市場コンテンツのランキングモードでは、g.game.vars.gameState.score の値をスコアとして扱います
	g.game.vars.gameState = { score: 0 };
	scene.loaded.add(() => {
		// ここからゲーム内容を記述します

		// 物理エンジン世界の生成
		const worldOption = {
			gravity: [0, 9.8],
			scale: 50,
			sleep: true
		};
		const box = new b2.Box2D(worldOption);

		// フォントの生成
		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.Serif,
			size: 48
		});

		// スコア表示用のラベル
		const scoreLabel = new g.Label({
			scene: scene,
			text: "SCORE: 0",
			font: font,
			fontSize: font.size / 2,
			textColor: "black"
		});
		// scene.append(scoreLabel);

		// 残り時間表示用ラベル
		const timeLabel = new g.Label({
			scene: scene,
			text: "TIME: 0",
			font: font,
			fontSize: font.size / 2,
			textColor: "black",
			x: 0.7 * g.game.width
		});
		scene.append(timeLabel);

		scene.update.add(() => {
			// 物理エンジンの世界を進める
			box.step(1 / g.game.fps);
		});
		// 地面
		const base = new g.FilledRect({
			scene: scene,
			width: g.game.width,
			height: 10,
			cssColor: "black",
			y: (300)
		});
		scene.append(base);
		const floorFixDef = box.createFixtureDef({
			density: 1.0, // 密度
			friction: 0.5, // 摩擦係数
			restitution: 0.3, // 反発係数
			shape: box.createRectShape(base.width, base.height) // 形状
		});
		const floorDef = box.createBodyDef({
			type: b2.BodyType.Static
		});
		const floorBody = box.createBody(base, floorDef, floorFixDef);


		// 画面をタッチしたとき、SEを鳴らします
		scene.pointDownCapture.add((event) => {
			// プレイヤーを生成します
			const entity = new g.Sprite({
				scene: scene,
				src: scene.assets["toomo"],
				width: (scene.assets["toomo"] as g.ImageAsset).width,
				height: (scene.assets["toomo"] as g.ImageAsset).height,
				x: event.point.x,
				y: event.point.y
			});
			scene.append(entity);
			entity.modified();

			const vertices = [
				box.vec2(7.5, -36.5),
				box.vec2(25.5, -11.5),
				box.vec2(18.5, 37.5),
				box.vec2(-14.5, 36.5),
				box.vec2(-30.5, 9.5),
				box.vec2(-35.5, -14.5),
				box.vec2(-15.5, -37.5)
			];

			const entityFixDef = box.createFixtureDef({
				density: 1.0, // 密度
				friction: 0.5, // 摩擦係数
				restitution: 0.3, // 反発係数
				shape: box.createPolygonShape(vertices) // 形状
			});

			const entityDef = box.createBodyDef({
				type: b2.BodyType.Dynamic
			});

			box.createBody(entity, entityDef, entityFixDef);

		});
		const updateHandler = () => {
			if (time <= 0) {
				// RPGアツマール環境であればランキングを表示します
				if (param.isAtsumaru) {
					const boardId = 1;
					window.RPGAtsumaru.experimental.scoreboards.setRecord(boardId, g.game.vars.gameState.score).then(function () {
						window.RPGAtsumaru.experimental.scoreboards.display(boardId);
					});
				}
				scene.update.remove(updateHandler); // カウントダウンを止めるためにこのイベントハンドラを削除します
			}
			// カウントダウン処理
			time -= 1 / g.game.fps;
			timeLabel.text = "TIME: " + Math.ceil(time);
			timeLabel.invalidate();
		};
		scene.update.add(updateHandler);
		// ここまでゲーム内容を記述します
	});
	g.game.pushScene(scene);
}
