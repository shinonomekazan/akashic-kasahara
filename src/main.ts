// NOTE
//   $ echo ' export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
//   $ source ~/.bash_profile
//
// NOTE: SE,BGMのファイル名にmaoudamashiiが含まれているのはは魔法魂のもの、他のSEは自作(使用ソフトはsfxr)

import { PointUpEvent, Scene } from "@akashic/akashic-engine";

interface NinjaPlayer {
	lastEv: g.PointMoveEvent | g.PointDownEvent | null;
	isPointPress: boolean;
	lastX: number;
	lastY: number;
	ninjaPos: {
		x: number;
		y: number;
	};
	ninja: g.FrameSprite;
}

let selfPlayerId: string = null;
const ninjaPlayers: { [key: string]: NinjaPlayer } = {};

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

	var groundLayer = new g.E({ scene: scene });
	var characterLayer = new g.E({ scene: scene });
	scene.append(groundLayer);
	scene.append(characterLayer);

	const font = new g.DynamicFont({
		game: g.game,
		fontFamily: "sans-serif",
		size: 64
	});

	function createNinja(playerId: string): NinjaPlayer {
		if (ninjaPlayers[playerId] != null) {
			return null;
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
			lastEv: null,
			isPointPress: false,
			lastX: 0,
			lastY: 0,
			ninjaPos: {
				x: 40,
				y: 240
			},
			ninja: ninjaSprite
		};
		ninjaPlayers[playerId] = ninjaPlayer;

		ninjaSprite.start();
		characterLayer.append(ninjaPlayer.ninja);

		return ninjaPlayer;
	}

	scene.onLoad.add(function (ev: Scene) {
		g.game.audio.music.volume = 0.2;
		g.game.audio.sound.volume = 0.4;

		selfPlayerId = ev.game.selfId;
		createNinja(selfPlayerId);

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
			createNinja(ev.player.id);
			const ninjaPlayer = ninjaPlayers[ev.player.id];
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.isPointPress = false;
		});

		scene.onPointMoveCapture.add(function (ev: g.PointMoveEvent) {
			createNinja(ev.player.id);
			const ninjaPlayer = ninjaPlayers[ev.player.id];
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.lastEv = ev;
			ninjaPlayer.lastX += ev.prevDelta.x;
			ninjaPlayer.lastY += ev.prevDelta.y;
		});
		scene.onPointDownCapture.add(function (ev: g.PointDownEvent) {
			createNinja(ev.player.id);
			const ninjaPlayer = ninjaPlayers[ev.player.id];
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.lastEv = ev;
			ninjaPlayer.isPointPress = true;

			ninjaPlayer.lastX = ev.point.x;
			ninjaPlayer.lastY = ev.point.y;
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
			frames: [0, 0, 0, 0, 1, 1, 1, 1],
			loop: true
		});
		characterLayer.append(enemySprite);
		enemySprite.start();

		// scene の onUpdate を設定し、毎フレーム実行する処理を記述
		scene.onUpdate.add(function () {
			mainLoop(scene);
		});

		// result
		// TODO: 後でランダム切り替えする多分
		winLabel = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("youWinJp"),
			y: 150
		});
		loseLabel = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("youLoseJp"),
			y: 150
		});

		winLabel.x = (480 - winLabel.width) / 2;
		loseLabel.x = (480 - loseLabel.width) / 2;
		scene.append(winLabel);
		scene.append(loseLabel);
		winLabel.hide();
		loseLabel.hide();

		scene.asset.getAudioById("game_maoudamashii_2_boss08").play();
	});

	// title scene
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
		});
	});
	g.game.pushScene(titleScene);
}

const shurikens: g.Sprite[] = [];
const shotInterval = 10;
let shotFrameCount = 10;
let enemySprite: g.FrameSprite = null;
let robotHP = 50;
let isEnemyDead = false;
let enemyMoveDirection = 0;
let explosionCount = 0;
const xorshift = new g.XorshiftRandomGenerator(13579);
let enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
const enemyBullets: { enemyBullet: g.Sprite; r: number }[] = [];
let isNinjaDead = false;
let winLabel: g.Sprite = null;
let loseLabel: g.Sprite = null;

function mainLoop(scene: g.Scene): void {
	for (const playerId of Object.keys(ninjaPlayers)) {
		const ninjaPlayer = ninjaPlayers[playerId];
		// Player
		const isPointPress = ninjaPlayer.isPointPress;
		if (isPointPress && !isNinjaDead) {
			if (shotFrameCount + shotInterval < g.game.age) {
				shotFrameCount = g.game.age;

				const shuriken = createShuriken(scene);
				shuriken.x = ninjaPlayer.ninjaPos.x + 32;
				shuriken.y = ninjaPlayer.ninjaPos.y;
				scene.append(shuriken);
				shuriken.start();
				scene.asset.getAudioById("shotSE").play();

				scene.setTimeout(function () {
					shuriken.destroy();
				}, 5000);

				// destroyしたものを配列から除く
				for (let i = 0; i < shurikens.length; i++) {
					if (shurikens[i].destroyed()) {
						shurikens.splice(i, 1);
						i--;
					}
				}
				// console.log("shurikens.length:" + shurikens.length);

				shurikens.push(shuriken);
			}

			if (ninjaPlayer.ninjaPos.x < ninjaPlayer.lastX) {
				ninjaPlayer.ninjaPos.x += 2;
			}
			if (ninjaPlayer.ninjaPos.x > ninjaPlayer.lastX) {
				ninjaPlayer.ninjaPos.x -= 2;
			}
			if (ninjaPlayer.ninjaPos.y < ninjaPlayer.lastY) {
				ninjaPlayer.ninjaPos.y += 2;
			}
			if (ninjaPlayer.ninjaPos.y > ninjaPlayer.lastY) {
				ninjaPlayer.ninjaPos.y -= 2;
			}
			ninjaPlayer.ninja.x = ninjaPlayer.ninjaPos.x;
			ninjaPlayer.ninja.y = ninjaPlayer.ninjaPos.y;
		}
	}

	// enemy move
	if (!isEnemyDead) {
		if (enemyMoveDirection === 0) {
			enemySprite.y += 0.5;
			if (enemySprite.y > 320) {
				enemyMoveDirection = 1;
			}
		} else {
			enemySprite.y -= 0.5;
			if (enemySprite.y < 80) {
				enemyMoveDirection = 0;
			}
		}
	}

	// player attack
	for (let shuriken of shurikens) {
		shuriken.x += 4;
		if (!enemySprite.visible()) {
			continue;
		}

		let isHitHead = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, enemySprite.x + 6, enemySprite.y + 20, 64, 36);
		let isHitBody = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, enemySprite.x + 71, enemySprite.y + 44, 104, 40);

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
	if (enemyAttackTime > 0 && !isNinjaDead && !isEnemyDead) {
		enemyAttackTime--; // TODO:フレーム数でなく時間でやる
		if (enemyAttackTime === 0) {
			for (const playerId of Object.keys(ninjaPlayers)) {
				const ninjaPlayer = ninjaPlayers[playerId];
				enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
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
				console.log("enemyBullets.length:" + enemyBullets.length);

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

		for (const playerId of Object.keys(ninjaPlayers)) {
			const ninjaSprite = ninjaPlayers[playerId].ninja;
			if (
				!isNinjaDead &&
				g.Collision.intersect(ninjaSprite.x + 4, ninjaSprite.y + 4, 24, 24, enemyBullet.x + 4, enemyBullet.y + 4, 24, 24)
			) {
				if (playerId === selfPlayerId) {
					isNinjaDead = true;
					scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
				}
				ninjaSprite.hide();
				delete ninjaPlayers[playerId];
				enemyBullet.destroy();
				explode(scene, ninjaSprite.x, ninjaSprite.y);
				scene.asset.getAudioById("explosionSE").play();
			}
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
	if (isEnemyDead) {
		winLabel.show();
		loseLabel.hide();
	} else if (isNinjaDead) {
		winLabel.hide();
		loseLabel.show();
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
