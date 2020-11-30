// TODO: とりあえず動かしてみた小汚いコードなのでリファクタする
// NOTE
//   $ echo ' export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
//   $ source ~/.bash_profile
function main(param) {

	var scene = new g.Scene({
		game: g.game,
		// このシーンで利用するアセットのIDを列挙し、シーンに通知します
		assetIds: ["explosion", "shot", "player", "enemy"]
	});
	scene.onLoad.add(function () {

		let lastEv = null;
		let isPointPress = false;
		scene.onPointUpCapture.add(function (ev) {
			isPointPress = false;
		});

		scene.onPointMoveCapture.add(function (ev) {
			lastEv = ev;
			console.log("onPointMoveCapture");
			console.dir(ev);
			lastX += ev.prevDelta.x;
			lastY += ev.prevDelta.y;
		});
		scene.onPointDownCapture.add(function (ev) {

			lastEv = ev;
			isPointPress = true;

			lastX = ev.point.x;
			lastY = ev.point.y;
		});

		ninja = new g.FrameSprite({
			scene: scene,
			src: scene.asset.getImageById("player"),
			width: 64,
			height: 32,
			srcWidth: 64,
			srcHeight: 32,
			x: 100,
			y: 100,
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
			x: 240,
			y: 240,
			frames: [0, 0, 0, 0, 1, 1, 1, 1],
			loop: true
		});
		scene.append(enemySprite);
		enemySprite.start();

		// scene の onUpdate を設定し、毎フレーム実行する処理を記述
		scene.onUpdate.add(function () {

			mainLoop(scene, lastEv, isPointPress);

			for (let i = 0; i < shurikens.length; i++) {
				shurikens[i].x += 4;
				if (shurikens[i].visible() && g.Collision.intersect(shurikens[i].x, shurikens[i].y, 32, 32, enemySprite.x, enemySprite.y, 96, 96)) {
					shurikens[i].hide();

					var explosion = new g.FrameSprite({
						scene: scene,
						src: scene.asset.getImageById("explosion"),
						width: 96,
						height: 96,
						srcWidth: 100,
						srcHeight: 100,
						x: shurikens[i].x,
						y: shurikens[i].y,
						frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
						loop: true
					});
					scene.append(explosion);
					explosion.start();
					scene.setTimeout(function () {
						explosion.destroy();
					}, 500);
				}
			}
		});
	});
	g.game.pushScene(scene);
}

let shurikens = [];
const shotInterval = 10;
let shotFrameCount = 10;
let lastX = 32;
let lastY = 240;
let ninja = null;
let ninjaPos = { x: 32, y: 240 };
let enemySprite = null;

function mainLoop(scene, ev, isPointPress) {
	if (isPointPress) {
		if (shotFrameCount + shotInterval < g.game.age) {
			shotFrameCount = g.game.age;
			const shuriken = createShuriken(scene);

			shuriken.x = ninjaPos.x + 32;
			shuriken.y = ninjaPos.y;
			scene.append(shuriken);
			shuriken.start();

			scene.setTimeout(function () {
				shuriken.destroy();
			}, 5000);

			shurikens.push(shuriken);
		}

		if (ninjaPos.x < lastX) {
			ninjaPos.x++;
		}
		if (ninjaPos.x > lastX) {
			ninjaPos.x--;
		}
		if (ninjaPos.y < lastY) {
			ninjaPos.y++;
		}
		if (ninjaPos.y > lastY) {
			ninjaPos.y--;
		}
		ninja.x = ninjaPos.x;
		ninja.y = ninjaPos.y;
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
		frames: [0, 0, 0, 0, 1, 1, 1, 1],
		// アニメーションをループする（省略した場合ループする）
		loop: true
	});
}

module.exports = main;
