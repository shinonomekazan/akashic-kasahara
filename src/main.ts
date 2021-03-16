// NOTE
//   $ echo ' export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
//   $ source ~/.bash_profile
//
// NOTE: SE,BGMのファイル名にmaoudamashiiが含まれているのはは魔法魂のもの、他のSEは自作(使用ソフトはsfxr)

import { Timeline } from "@akashic-extension/akashic-timeline";
import { PointUpEvent, Scene } from "@akashic/akashic-engine";

interface NinjaPlayer {
	isPointPress: boolean;
	pointX: number;
	pointY: number;
	ninjaPos: {
		x: number;
		y: number;
	};
	ninja: g.FrameSprite;
	zombie: number;
	shotFrameCount: number;
}

let selfPlayerId: string = null;
const ninjaPlayers: { [key: string]: NinjaPlayer } = {};

const font = new g.DynamicFont({
	game: g.game,
	fontFamily: "sans-serif",
	size: 64
});

let characterLayer: g.E = null;

function createTitleScene(scene: g.Scene): g.Scene {
	const titleScene = new g.Scene({
		game: g.game
	});
	titleScene.onLoad.add(function () {
		const titleLabel = new g.Label({
			scene: titleScene,
			font: font,
			text: "Ninja Burner",
			fontSize: 64,
			textColor: "white",
			x: 10,
			y: 150
		});
		const startLabel = new g.Label({
			scene: titleScene,
			font: font,
			text: "Click to start!",
			fontSize: 32,
			textColor: "white",
			x: 10,
			y: 280
		});
		const rect = new g.FilledRect({
			scene: titleScene,
			cssColor: "black",
			width: 480,
			height: 480
		});
		titleLabel.x = (480 - titleLabel.width) / 2;
		startLabel.x = (480 - startLabel.width) / 2;
		titleScene.append(rect);
		titleScene.append(titleLabel);
		titleScene.append(startLabel);

		titleScene.onPointDownCapture.add(function () {
			g.game.replaceScene(scene);
			init();
		});
	});
	// g.game.pushScene(titleScene);
	return titleScene;
}

function createNinja(scene: g.Scene, characterLayer: g.E, playerId: string): NinjaPlayer {
	if (ninjaPlayers[playerId] != null) {
		return ninjaPlayers[playerId];
	}
	const ninjaSprite = new g.FrameSprite({
		scene: scene,
		src: scene.asset.getImageById("player"),
		width: 64,
		height: 32,
		srcWidth: 64,
		srcHeight: 32,
		x: 40,
		y: 240,
		frames: [0, 0, 0, 0, 1, 1, 1, 1],
		loop: true
	});
	const ninjaPlayer: NinjaPlayer = {
		isPointPress: false,
		pointX: 0,
		pointY: 0,
		ninjaPos: {
			x: 40,
			y: 240
		},
		ninja: ninjaSprite,
		zombie: 0,
		shotFrameCount: 10
	};
	ninjaPlayers[playerId] = ninjaPlayer;

	ninjaSprite.start();
	characterLayer.append(ninjaPlayer.ninja);

	return ninjaPlayer;
}

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: [
			"explosion",
			"shot",
			"player",
			"enemy",
			"bullet",
			"background",
			"shotSE",
			"game_maoudamashii_2_boss08",
			"se_maoudamashii_retro30",
			"game_maoudamashii_9_jingle05",
			"explosionSE",
			"youWin",
			"youLose",
			"youWinJp",
			"youLoseJp"
		]
	});

	const groundLayer = new g.E({ scene: scene });
	characterLayer = new g.E({ scene: scene });
	scene.append(groundLayer);
	scene.append(characterLayer);



	scene.onLoad.add(function (ev: Scene) {
		g.game.audio.music.volume = 0.1;
		g.game.audio.sound.volume = 0.2;

		selfPlayerId = ev.game.selfId;
		// createNinja(selfPlayerId);

		const background = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("background"),
			x: 0,
			y: 0,
			scaleX: 2,
			scaleY: 2,
		});
		groundLayer.append(background);

		scene.onPointUpCapture.add(function (ev: PointUpEvent) {
			const ninjaPlayer = createNinja(scene, characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.isPointPress = false;
			ninjaPlayer.pointX += ev.prevDelta.x;
			ninjaPlayer.pointY += ev.prevDelta.y;
		});

		scene.onPointMoveCapture.add(function (ev: g.PointMoveEvent) {
			const ninjaPlayer = createNinja(scene, characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.pointX += ev.prevDelta.x;
			ninjaPlayer.pointY += ev.prevDelta.y;
		});
		scene.onPointDownCapture.add(function (ev: g.PointDownEvent) {
			const ninjaPlayer = createNinja(scene, characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.isPointPress = true;

			ninjaPlayer.pointX = ev.point.x;
			ninjaPlayer.pointY = ev.point.y;
		});

		enemySprite = new g.FrameSprite({
			scene: scene,
			src: scene.asset.getImageById("enemy"),
			width: 192,
			height: 128,
			srcWidth: 192,
			srcHeight: 128,
			x: 280,
			y: 200,
			frames: [0, 1],
			loop: true,
			interval: 200
		});
		characterLayer.append(enemySprite);
		enemySprite.start();

		// enemy move settings
		const timeline = new Timeline(scene);
		timeline.create(enemySprite, { loop: true })
			.moveY(80, 7000)
			.moveY(80, 3000)
			.moveY(320, 7000)
			.moveY(320, 3000);

		// scene の onUpdate を設定し、毎フレーム実行する処理を記述
		scene.onUpdate.add(function () {
			mainLoop(scene);
		});

		// result
		winLabel = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("youWinJp"),
			y: 150
		});

		winLabel.x = (480 - winLabel.width) / 2;
		scene.append(winLabel);
		winLabel.hide();

		winLabel.touchable = true;
		winLabel.onPointUp.add(function (ev: PointUpEvent) {
			const titleScene = createTitleScene(scene);
			g.game.pushScene(titleScene);
			scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
			scene.asset.getAudioById("game_maoudamashii_9_jingle05").stop();
		});
	});

	scene.onMessage.add(function (msg: g.MessageEvent) {
		if (msg.data.playerId) {
			createNinja(scene, characterLayer, msg.data.playerId);
		}
	});

	// TODO: ビットマップフォントにしたい
	zombieLabel = new g.Label({
		scene: scene,
		font: font,
		text: "",
		fontSize: 16,
		textColor: "white"
	});
	scene.append(zombieLabel);
	zombieLabel.hide();

	// title
	const titleScene = createTitleScene(scene);
	g.game.pushScene(titleScene);
}

function init(): void {
	robotHP = 50;
	isEnemyDead = false;
	explosionCount = 0;
	isSendFirstEvent = false;

	if (enemySprite) { // うーん、いったん
		enemySprite.x = 280;
		enemySprite.y = 200;
		enemySprite.show();
	}
	enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);

	if (winLabel) {
		winLabel.hide();
	}

	shurikens.forEach(function (shuriken: g.Sprite) {
		destroySprite(shuriken);
	});
	shurikens = [];
	for (const playerId of Object.keys(ninjaPlayers)) {
		const ninjaPlayer = ninjaPlayers[playerId];
		ninjaPlayer.shotFrameCount = 10;
	}
}

let zombieLabel: g.Label;
let shurikens: g.Sprite[] = [];
const shotInterval = 10;
let enemySprite: g.FrameSprite = null;
let robotHP = 50;
let isEnemyDead = false;
let explosionCount = 0;
const xorshift = new g.XorshiftRandomGenerator(13579);
let enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
const enemyBullets: { enemyBullet: g.Sprite; r: number }[] = [];
let winLabel: g.Sprite = null;
let isSendFirstEvent = false;

function mainLoop(scene: g.Scene): void {
	if (!g.game.isSkipping && !isSendFirstEvent) {
		// ゲーム開始時の初期位置をみんなに送る。NOTE:早送り中はイベントを送信できないもよう
		g.game.raiseEvent(new g.MessageEvent({ playerId: selfPlayerId }));
		scene.asset.getAudioById("game_maoudamashii_2_boss08").play();
		isSendFirstEvent = true;
	}

	// player zombie
	for (const playerId of Object.keys(ninjaPlayers)) {
		const ninjaPlayer = ninjaPlayers[playerId];
		if (ninjaPlayer.zombie > 0) {
			ninjaPlayer.zombie--;
			if (ninjaPlayer.zombie === 0) {
				ninjaPlayer.ninja.opacity = 1.0;
				if (playerId === selfPlayerId) {
					zombieLabel.hide();
					if (!winLabel.visible()) {
						scene.asset.getAudioById("game_maoudamashii_2_boss08").play();
					}
				}
			} else {
				ninjaPlayer.ninja.opacity = 0.2;
				if (playerId === selfPlayerId) {
					zombieLabel.show();
					zombieLabel.x = ninjaPlayer.ninja.x + 12;
					zombieLabel.y = ninjaPlayer.ninja.y - 16;
					zombieLabel.text = "" + (Math.floor(ninjaPlayer.zombie / 30) + 1);
					zombieLabel.invalidate();
				}
			}
			continue;
		}
	}

	// Player move & shot
	for (const playerId of Object.keys(ninjaPlayers)) {
		const ninjaPlayer = ninjaPlayers[playerId];
		const isPointPress = ninjaPlayer.isPointPress;
		if (isPointPress) {
			if ((ninjaPlayer.zombie === 0) && (ninjaPlayer.shotFrameCount + shotInterval < g.game.age)) {
				ninjaPlayer.shotFrameCount = g.game.age;

				const shuriken = createShuriken(scene);
				shuriken.x = ninjaPlayer.ninjaPos.x + 32;
				shuriken.y = ninjaPlayer.ninjaPos.y;
				scene.append(shuriken);
				shuriken.start();
				scene.asset.getAudioById("shotSE").play();

				scene.setTimeout(function () {
					destroySprite(shuriken);
				}, 5000);

				// destroyしたものを配列から除く
				for (let i = 0; i < shurikens.length; i++) {
					if (shurikens[i].destroyed()) {
						shurikens.splice(i, 1);
						i--;
					}
				}

				shurikens.push(shuriken);
			}

			// TODO: タップ開始座標を基準に上下左右にしたい
			if (ninjaPlayer.ninjaPos.x < ninjaPlayer.pointX) {
				ninjaPlayer.ninjaPos.x += 2;
			}
			if (ninjaPlayer.ninjaPos.x > ninjaPlayer.pointX) {
				ninjaPlayer.ninjaPos.x -= 2;
			}
			if (ninjaPlayer.ninjaPos.y < ninjaPlayer.pointY) {
				ninjaPlayer.ninjaPos.y += 2;
			}
			if (ninjaPlayer.ninjaPos.y > ninjaPlayer.pointY) {
				ninjaPlayer.ninjaPos.y -= 2;
			}
			ninjaPlayer.ninja.x = ninjaPlayer.ninjaPos.x;
			ninjaPlayer.ninja.y = ninjaPlayer.ninjaPos.y;
		}
	}

	// player attack
	for (const shuriken of shurikens) {
		shuriken.x += 4;
		if (!enemySprite.visible()) {
			continue;
		}

		const isHitHead = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, enemySprite.x + 6, enemySprite.y + 20, 64, 36);
		const isHitBody = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, enemySprite.x + 71, enemySprite.y + 44, 104, 40);

		if (shuriken.visible() && (isHitHead || isHitBody)) {
			shuriken.hide();

			scene.asset.getAudioById("explosionSE").play();

			const explosion = new g.FrameSprite({
				scene: scene,
				src: scene.asset.getImageById("explosion"),
				width: 16,
				height: 16,
				srcWidth: 16,
				srcHeight: 16,
				x: shuriken.x,
				y: shuriken.y,
				frames: [0, 1, 2],
				loop: true,
				scaleX: 2,
				scaleY: 2,
				interval: 100
			});
			scene.append(explosion);
			explosion.start();
			scene.setTimeout(function () {
				explosion.destroy();
			}, 300);

			robotHP--;
			if (!isEnemyDead && robotHP <= 0) {
				isEnemyDead = true;
				explosionCount = 100;
				scene.asset.getAudioById("se_maoudamashii_retro30").play();
			}
		}
	}

	// enemy attack
	if (enemyAttackTime > 0 && !isEnemyDead) {
		enemyAttackTime--; // TODO:フレーム数でなく時間でやる
		if (enemyAttackTime === 0) {
			enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
			for (const playerId of Object.keys(ninjaPlayers)) {
				const ninjaPlayer = ninjaPlayers[playerId];
				if (ninjaPlayer.zombie > 0) {
					continue;
				}
				const enemyBullet = new g.FrameSprite({
					scene: scene,
					src: scene.asset.getImageById("bullet"),
					width: 16,
					height: 16,
					srcWidth: 16,
					srcHeight: 16,
					x: enemySprite.x + 10,
					y: enemySprite.y + 16,
					frames: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // いったんこれで
					loop: true,
					scaleX: 2,
					scaleY: 2,
					// interval: 200
				});
				scene.append(enemyBullet);
				enemyBullet.start();

				scene.setTimeout(function () {
					if (!enemyBullet.destroyed()) {
						enemyBullet.destroy();
					}
				}, 5000);

				// destroyしたものを配列から除く
				for (let i = 0; i < enemyBullets.length; i++) {
					if (enemyBullets[i].enemyBullet.destroyed()) {
						enemyBullets.splice(i, 1);
						i--;
					}
				}

				const enemyBulletR = Math.atan2(ninjaPlayer.ninja.y - enemyBullet.y, ninjaPlayer.ninja.x - enemyBullet.x);
				enemyBullets.push({ enemyBullet, r: enemyBulletR });
			}
		}
	}
	for (const e of enemyBullets) {
		if (e.enemyBullet.destroyed()) { // いったんこれで
			continue;
		}
		const enemyBullet = e.enemyBullet;
		const enemyBulletR = e.r;
		enemyBullet.x += Math.cos(enemyBulletR) * 3;
		enemyBullet.y += Math.sin(enemyBulletR) * 3;
		let isHit = false;

		for (const playerId of Object.keys(ninjaPlayers)) {
			const ninjaSprite = ninjaPlayers[playerId].ninja;
			if (
				ninjaPlayers[playerId].zombie === 0 &&
				g.Collision.intersect(ninjaSprite.x + 4, ninjaSprite.y + 4, 24, 24, enemyBullet.x + 4, enemyBullet.y + 4, 24, 24)
			) {
				isHit = true;
				explode(scene, ninjaSprite.x, ninjaSprite.y);
				scene.asset.getAudioById("explosionSE").play();
				ninjaPlayers[playerId].zombie = 30 * 5;
				if (playerId === selfPlayerId) {
					scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
				}
			}
		}
		if (isHit) {
			destroySprite(enemyBullet);
		}
	}

	// enemy explosion
	if (explosionCount > 0) {
		explosionCount--;
		if (explosionCount === 0) {
			enemySprite.hide();
			scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
			scene.asset.getAudioById("game_maoudamashii_9_jingle05").play();
		}
		explode(
			scene,
			enemySprite.x + xorshift.generate() * enemySprite.width,
			enemySprite.y + xorshift.generate() * enemySprite.height
		);
	}

	// result
	if (isEnemyDead && explosionCount <= 0) {
		winLabel.show();
	}
}

function createShuriken(scene: g.Scene): g.FrameSprite {
	return new g.FrameSprite({
		scene: scene,
		src: scene.asset.getImageById("shot"),
		// エンティティのサイズ
		width: 32,
		height: 32,
		// 元画像のフレーム1つのサイズ
		srcWidth: 32,
		srcHeight: 32,
		// x: ev.point.x - size / 2,
		// y: ev.point.y - size / 2,
		// アニメーションに利用するフレームのインデックス配列
		// インデックスは元画像の左上から右にsrcWidthとsrcHeightの矩形を並べて数え上げ、右端に達したら一段下の左端から右下に達するまで繰り返す
		frames: [0, 1],
		// アニメーションをループする（省略した場合ループする）
		loop: true,
		interval: 100
	});
}

function destroySprite(sprite: g.Sprite): void {
	if (!sprite.destroyed()) {
		sprite.destroy();
	}
}

function explode(scene: g.Scene, x: number, y: number): void {
	const explosion = new g.FrameSprite({
		scene: scene,
		src: scene.asset.getImageById("explosion"),
		width: 16,
		height: 16,
		srcWidth: 16,
		srcHeight: 16,
		x: x,
		y: y,
		frames: [0, 1, 2],
		loop: true,
		scaleX: 2,
		scaleY: 2,
		interval: 100
	});
	scene.append(explosion);
	explosion.start();
	scene.setTimeout(function () {
		explosion.destroy();
	}, 300);
}

export = main;
