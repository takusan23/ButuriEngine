import { GameMainParameterObject, RPGAtsumaruWindow } from "./parameterObject";
import * as b2 from "@akashic-extension/akashic-box2d";

declare const window: RPGAtsumaruWindow;

export function main(param: GameMainParameterObject): void {

	const toomoTumiList: g.Sprite[] = [];

	const scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: ["player", "shot", "se", "karaoke", "toomo", "inu", "n_kou"]
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

		interface FaceObj {
			assetSrc: string;
			atariHanteiList: b2.Box2DWeb.Common.Math.b2Vec2[];
		}

		// 生成するもの
		const defultToomo: FaceObj = {
			assetSrc: "toomo",
			atariHanteiList: [box.vec2(7.5, -36.5),
			box.vec2(25.5, -11.5),
			box.vec2(18.5, 37.5),
			box.vec2(-14.5, 36.5),
			box.vec2(-30.5, 9.5),
			box.vec2(-35.5, -14.5),
			box.vec2(-15.5, -37.5)]
		};
		const karaoke: FaceObj = {
			assetSrc: "inu",
			atariHanteiList: [
				box.vec2(12, -38.5),
				box.vec2(27, -32.5),
				box.vec2(36, -20.5),
				box.vec2(45, -9.5),
				box.vec2(49, -4.5),
				box.vec2(49, 21.5),
				box.vec2(37, 37.5),
				box.vec2(-41, 32.5),
				box.vec2(-50, 21.5),
				box.vec2(-50, -0.5),
				box.vec2(-41, -15.5),
				box.vec2(-34, -25.5),
				box.vec2(-24, -32.5),
				box.vec2(-7, -39.5)
			]
		};
		const nKou: FaceObj = {
			assetSrc: "n_kou",
			atariHanteiList: [
				box.vec2(25, -25),
				box.vec2(25, 25),
				box.vec2(-25, 25),
				box.vec2(-25, -25)
			]
		};
		// 生成する物体の配列
		const faceObjList: FaceObj[] = [defultToomo, karaoke, nKou];

		// 画面をタッチしたとき、SEを鳴らします
		scene.pointDownCapture.add((event) => {
			const xPos = event.point.x;
			const yPos = event.point.y;

			// プレイヤーを生成します
			const random = g.game.random.get(0, faceObjList.length - 1);
			const sprite = createFace(faceObjList[random], xPos, yPos);
			toomoTumiList.push(sprite);
		});

		const camera = new g.Camera2D({ game: g.game });
		g.game.focusingCamera = camera;
		g.game.modified = true;

		scene.update.add(() => {
			toomoTumiList.sort((a, b) => {
				if (a.y < b.y) return -1;
				if (a.y > b.y) return 1;
				return 0;
			});
			if (toomoTumiList[0].y <= 0) {
				camera.y = toomoTumiList[0].y - (g.game.height / 2);
				camera.modified();
			}
		});

		/** 物体作成関数 */
		const createFace = (obj: FaceObj, xPos: number, yPos: number): g.Sprite => {
			const entity = new g.Sprite({
				scene: scene,
				src: scene.assets[obj.assetSrc],
				width: (scene.assets[obj.assetSrc] as g.ImageAsset).width,
				height: (scene.assets[obj.assetSrc] as g.ImageAsset).height,
				x: xPos,
				y: yPos
			});
			scene.append(entity);
			entity.modified();
			const entityFixDef = box.createFixtureDef({
				density: 1.0, // 密度
				friction: 0.5, // 摩擦係数
				restitution: 0.3, // 反発係数
				shape: box.createPolygonShape(obj.atariHanteiList) // 形状
			});

			const entityDef = box.createBodyDef({
				type: b2.BodyType.Dynamic
			});
			box.createBody(entity, entityDef, entityFixDef);
			return entity;
		};

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
