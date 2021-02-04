// TODO: とりあえず動かしてみた小汚いコードなのでリファクタする。長いので関数作って分けないと！
// NOTE
//   $ echo ' export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
//   $ source ~/.bash_profile
//
// NOTE: SE,BGMのファイル名にmaoudamashiiが含まれているのはは魔法魂のもの、他のSEは自作(使用ソフトはsfxr)
function main(param) {
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

	const font = new g.DynamicFont({
		game: g.game,
		fontFamily: "sans-serif",
		size: 64
	});


	scene.onLoad.add(function () {
		g.game.audio.music.volume = 0.2;
		g.game.audio.sound.volume = 0.4;
		let lastEv = null;
		let isPointPress = false;
		scene.onPointUpCapture.add(function (ev) {
			isPointPress = false;
		});

		scene.onPointMoveCapture.add(function (ev) {
			lastEv = ev;
			lastX += ev.prevDelta.x;
			lastY += ev.prevDelta.y;
		});
		scene.onPointDownCapture.add(function (ev) {
			lastEv = ev;
			isPointPress = true;

			lastX = ev.point.x;
			lastY = ev.point.y;
		});

		const background = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("background"),
			x: 0,
			y: 0,
			scaleX: 2,
			scaleY: 2,
		});
		scene.append(background);

		ninja = new g.FrameSprite({
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
		scene.append(ninja);
		ninja.start();

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
		scene.append(enemySprite);
		enemySprite.start();

		// scene の onUpdate を設定し、毎フレーム実行する処理を記述
		scene.onUpdate.add(function () {
			mainLoop(scene, lastEv, isPointPress);
		});

		// result
		/*
		winLabel = new g.Label({
			scene: scene,
			font: font,
			text: "YOU WIN",
			fontSize: 64,
			textColor: "white",
			x: 10,
			y: 150
		});
		loseLabel = new g.Label({
			scene: scene,
			font: font,
			text: "YOU LOSE",
			fontSize: 64,
			textColor: "white",
			x: 10,
			y: 150
		});
		*/

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

let shurikens = [];
const shotInterval = 10;
let shotFrameCount = 10;
let lastX = 32;
let lastY = 240;
let ninja = null;
let ninjaPos = { x: 32, y: 240 };
let enemySprite = null;
let robotHP = 50;
let isEnemyDead = false;
let enemyMoveDirection = 0;
let explosionCount = 0;
const xorshift = new g.XorshiftRandomGenerator(13579);
let enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
let enemyBulletR = 0;
let enemyBullet = null;
let isNinjaDead = false;
let winLabel = null;
let loseLabel = null;

function mainLoop(scene, ev, isPointPress) {
	// Player
	if (isPointPress && !isNinjaDead) {
		if (shotFrameCount + shotInterval < g.game.age) {
			shotFrameCount = g.game.age;
			const shuriken = createShuriken(scene);

			shuriken.x = ninjaPos.x + 32;
			shuriken.y = ninjaPos.y;
			scene.append(shuriken);
			shuriken.start();
			scene.asset.getAudioById("shotSE").play();

			scene.setTimeout(function () {
				shuriken.destroy();
			}, 5000);

			shurikens.push(shuriken);
		}

		if (ninjaPos.x < lastX) {
			ninjaPos.x += 2;
		}
		if (ninjaPos.x > lastX) {
			ninjaPos.x -= 2;
		}
		if (ninjaPos.y < lastY) {
			ninjaPos.y += 2;
		}
		if (ninjaPos.y > lastY) {
			ninjaPos.y -= 2;
		}
		ninja.x = ninjaPos.x;
		ninja.y = ninjaPos.y;
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
	for (let i = 0; i < shurikens.length; i++) {
		shurikens[i].x += 4;
		if (!enemySprite.visible()) {
			continue;
		}

		let isHitHead = g.Collision.intersect(shurikens[i].x + 4, shurikens[i].y + 4, 24, 24, enemySprite.x + 6, enemySprite.y + 20, 64, 36);
		let isHitBody = g.Collision.intersect(shurikens[i].x + 4, shurikens[i].y + 4, 24, 24, enemySprite.x + 71, enemySprite.y + 44, 104, 40);

		if (shurikens[i].visible() && (isHitHead || isHitBody)) {
			shurikens[i].hide();

			scene.asset.getAudioById("explosionSE").play();

			const explosion = new g.FrameSprite({
				scene: scene,
				src: scene.asset.getImageById("explosion"),
				width: 16,
				height: 16,
				srcWidth: 16,
				srcHeight: 16,
				x: shurikens[i].x, // centerXとか欲しい...
				y: shurikens[i].y,
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
		enemyAttackTime--;
		if (enemyAttackTime === 0) {
			enemyAttackTime = Math.floor(xorshift.generate() * 50 + 100);
			enemyBullet = new g.FrameSprite({
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
				//interval: 200
			});
			scene.append(enemyBullet);
			enemyBullet.start();
			/* いったんこれで
			scene.setTimeout(function () {
				enemyBullet.destroy();
			}, 5000);
			*/
			enemyBulletR = Math.atan2(ninja.y - enemyBullet.y, ninja.x - enemyBullet.x);
		}
	}
	if (enemyBullet != null) {
		enemyBullet.x += Math.cos(enemyBulletR) * 3;
		enemyBullet.y += Math.sin(enemyBulletR) * 3;

		// ninja damage
		if (!isNinjaDead && g.Collision.intersect(ninja.x + 4, ninja.y + 4, 24, 24, enemyBullet.x + 4, enemyBullet.y + 4, 24, 24)) {
			isNinjaDead = true;
			enemyBullet.destroy();
			ninja.hide();
			explode(scene, ninja.x, ninja.y);
			scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
			scene.asset.getAudioById("explosionSE").play();
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

function createShuriken(scene) {
	return new g.FrameSprite({
		scene: scene,
		src: scene.asset.getImageById("shot"),
		// エンティティのサイズ
		width: 32,
		height: 32,
		// 元画像のフレーム1つのサイズ
		srcWidth: 32,
		srcHeight: 32,
		//x: ev.point.x - size / 2,
		//y: ev.point.y - size / 2,
		// アニメーションに利用するフレームのインデックス配列
		// インデックスは元画像の左上から右にsrcWidthとsrcHeightの矩形を並べて数え上げ、右端に達したら一段下の左端から右下に達するまで繰り返す
		frames: [0, 1],
		// アニメーションをループする（省略した場合ループする）
		loop: true,
		interval: 100
	});
}

function explode(scene, x, y) {
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

module.exports = main;
