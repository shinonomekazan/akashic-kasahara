import { Timeline, Tween } from "@akashic-extension/akashic-timeline";
import { E, PointUpEvent } from "@akashic/akashic-engine";

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
	shotAge: number;
	shotInterval: number;
};

const font = new g.DynamicFont({
	game: g.game,
	fontFamily: "sans-serif",
	size: 64
});

class MainScene extends g.Scene {

	ninjaPlayers: { [key: string]: NinjaPlayer } = {};
	groundLayer: E;
	characterLayer: E;
	zombieLabel: g.Label;
	shurikens: g.Sprite[] = [];
	enemySprites: g.FrameSprite[] = [];
	powerups: g.FrameSprite[] = [];
	bossSprite: g.FrameSprite = null;
	bossHP = 150;
	isEnemyDead = false;
	explosionCount = 0;
	readonly xorshift = new g.XorshiftRandomGenerator(13579);
	enemyAttackTime: number;
	readonly enemyBullets: { enemyBullet: g.Sprite; r: number }[] = [];
	winLabel: g.Sprite = null;
	isSendFirstEvent = false;
	finishFunc: Function;
	timeline: Timeline;
	bossTween: Tween;
	groundScrollTween: Tween;
	isShowBoss: boolean = false;

	constructor(game: g.Game, finishFunc: Function) {
		super({
			game,
			assetIds: [
				"explosion",
				"shot",
				"player",
				"enemy",
				"boss",
				"bullet",
				"background",
				"shotSE",
				"game_maoudamashii_1_battle01",
				"game_maoudamashii_2_boss08",
				"se_maoudamashii_retro30",
				"game_maoudamashii_9_jingle05",
				"explosionSE",
				"youWin",
				"youLose",
				"youWinJp",
				"youLoseJp",
				"powerup",
				"powerup07",
				"powerup_effect"
			]
		});
		this.finishFunc = finishFunc;
		this.onLoad.addOnce(this.handleLoad, this);
	}
	handleLoad() {
		const scene = this;

		this.groundLayer = new g.E({ scene: scene });
		this.characterLayer = new g.E({ scene: scene });
		scene.append(this.groundLayer);
		scene.append(this.characterLayer);

		scene.onPointMoveCapture.add(function (ev: g.PointMoveEvent) {
			const ninjaPlayer = this.createNinja(scene, this.characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.pointX += ev.prevDelta.x;
			ninjaPlayer.pointY += ev.prevDelta.y;
		}, this);
		scene.onPointUpCapture.add(function (ev: PointUpEvent) {
			const ninjaPlayer = this.createNinja(scene, this.characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.isPointPress = false;
			ninjaPlayer.pointX += ev.prevDelta.x;
			ninjaPlayer.pointY += ev.prevDelta.y;
		}, this);
		scene.onPointDownCapture.add(function (ev: g.PointDownEvent) {
			const ninjaPlayer = this.createNinja(scene, this.characterLayer, ev.player.id);
			if (ninjaPlayer == null) {
				return;
			}

			ninjaPlayer.isPointPress = true;

			ninjaPlayer.pointX = ev.point.x;
			ninjaPlayer.pointY = ev.point.y;
		}, this);

		this.timeline = new Timeline(scene);

		const background = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("background"),
			x: 0,
			y: 0,
			scaleX: 2,
			scaleY: 2,
		});

		this.groundLayer.append(background);

		this.groundScrollTween = this.timeline.create(background, { loop: true }).moveX(-384, 384 * 2000 / this.game.fps).moveX(0, 0);

		const enemyPositionData = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1],
			[0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 1, 1, 0, 2, 0, 0, 1, 1],
			[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 2, 0, 1, 0, 0, 1, 1],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 1, 1, 0, 2, 0, 0, 1, 1],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1],
		];
		for (let y = 0; y < enemyPositionData.length; y++) {
			for (let x = 0; x < enemyPositionData[y].length; x++) {
				if (enemyPositionData[y][x] === 1) {
					const sprite = new g.FrameSprite({
						scene: scene,
						src: scene.asset.getImageById("enemy"),
						width: 32,
						height: 32,
						srcWidth: 32,
						srcHeight: 32,
						x: 480 + x * 48,
						y: 108 + y * 64,
						frames: [0, 1],
						loop: true,
						interval: 200
					});
					sprite.start();
					this.characterLayer.append(sprite);

					this.timeline.create(sprite).moveX(-32, (sprite.x + 32) * 1000 / this.game.fps);

					this.enemySprites.push(sprite);
				} else if (enemyPositionData[y][x] === 2) {
					const sprite = new g.FrameSprite({
						scene: scene,
						src: scene.asset.getImageById("enemy"),
						width: 32,
						height: 32,
						srcWidth: 32,
						srcHeight: 32,
						x: 480 + x * 48,
						y: 108 + y * 64,
						frames: [2, 3],
						loop: true,
						interval: 200
					});
					sprite.start();
					this.characterLayer.append(sprite);

					this.timeline.create(sprite).moveX(-32, (sprite.x + 32) * 1000 / this.game.fps);
					this.timeline.create(sprite, { loop: true }).moveY(sprite.y - 16, 1000).moveY(sprite.y + 16, 1000);

					this.enemySprites.push(sprite);
				}
			}
		}

		this.bossSprite = new g.FrameSprite({
			scene: scene,
			src: scene.asset.getImageById("boss"),
			width: 192,
			height: 128,
			srcWidth: 192,
			srcHeight: 128,
			x: 480 + 53 * 48,
			y: 200,
			frames: [0, 1],
			loop: true,
			interval: 200
		});
		this.characterLayer.append(this.bossSprite);
		this.bossSprite.start();

		this.enemyAttackTime = 100 * this.game.fps;

		// boss move settings
		this.bossTween = this.timeline.create(this.bossSprite, { loop: false })
			.moveX(280, (this.bossSprite.x + 32) * 1000 / this.game.fps);

		// TODO: ビットマップフォントにしたい
		this.zombieLabel = new g.Label({
			scene: scene,
			font: font,
			text: "",
			fontSize: 16,
			textColor: "white"
		});
		scene.append(this.zombieLabel);
		this.zombieLabel.hide();

		scene.onMessage.add(function (msg: g.MessageEvent) {
			if (msg.data.playerId) {
				this.createNinja(scene, this.characterLayer, msg.data.playerId);
			}
		}, this);

		// scene の onUpdate を設定し、毎フレーム実行する処理を記述
		scene.onUpdate.add(this.mainLoop, this);

		// result
		this.winLabel = new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("youWinJp"),
			y: 150
		});

		this.winLabel.x = (480 - this.winLabel.width) / 2;
		scene.append(this.winLabel);
		this.winLabel.hide();

		this.winLabel.touchable = true;
		this.winLabel.onPointUp.add(function (ev: PointUpEvent) {
			scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
			scene.asset.getAudioById("game_maoudamashii_9_jingle05").stop();
			this.finishFunc();
		}, this);
	}

	createNinja(scene: g.Scene, characterLayer: g.E, playerId: string): NinjaPlayer {
		if (this.ninjaPlayers[playerId] != null) {
			return this.ninjaPlayers[playerId];
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
			shotAge: 10,
			shotInterval: 20
		};
		this.ninjaPlayers[playerId] = ninjaPlayer;

		ninjaSprite.start();
		characterLayer.append(ninjaPlayer.ninja);

		return ninjaPlayer;
	}

	mainLoop(): void {
		const scene = this;

		if (!g.game.isSkipping && !this.isSendFirstEvent) {
			// ゲーム開始時の初期位置をみんなに送る。NOTE:早送り中はイベントを送信できないもよう
			g.game.raiseEvent(new g.MessageEvent({ playerId: this.game.selfId }));
			scene.asset.getAudioById("game_maoudamashii_1_battle01").play();
			this.isSendFirstEvent = true;
		}

		// player zombie now
		for (const playerId of Object.keys(this.ninjaPlayers)) {
			const ninjaPlayer = this.ninjaPlayers[playerId];
			if (ninjaPlayer.zombie > 0) {
				ninjaPlayer.zombie--;
				if (ninjaPlayer.zombie === 0) {
					ninjaPlayer.ninja.opacity = 1.0;
					if (playerId === this.game.selfId) {
						this.zombieLabel.hide();
						if (!this.winLabel.visible()) {
							//scene.asset.getAudioById("game_maoudamashii_2_boss08").play();
						}
					}
				} else {
					ninjaPlayer.ninja.opacity = 0.2;
					if (playerId === this.game.selfId) {
						this.zombieLabel.show();
						this.zombieLabel.x = ninjaPlayer.ninja.x + 12;
						this.zombieLabel.y = ninjaPlayer.ninja.y - 16;
						this.zombieLabel.text = "" + (Math.floor(ninjaPlayer.zombie / this.game.fps) + 1);
						this.zombieLabel.invalidate();
					}
				}
				continue;
			}
		}

		// Player move & shot
		for (const playerId of Object.keys(this.ninjaPlayers)) {
			const ninjaPlayer = this.ninjaPlayers[playerId];
			const isPointPress = ninjaPlayer.isPointPress;
			if (isPointPress) {
				if ((ninjaPlayer.zombie === 0) && (ninjaPlayer.shotAge + ninjaPlayer.shotInterval < g.game.age)) {
					ninjaPlayer.shotAge = g.game.age;

					const shuriken = this.createShuriken(scene);
					shuriken.x = ninjaPlayer.ninjaPos.x + 32;
					shuriken.y = ninjaPlayer.ninjaPos.y;
					scene.append(shuriken);
					shuriken.start();
					scene.asset.getAudioById("shotSE").play();

					// destroyしたものを配列から除く
					for (let i = 0; i < this.shurikens.length; i++) {
						if (this.shurikens[i].destroyed()) {
							this.shurikens.splice(i, 1);
							i--;
						}
					}

					this.shurikens.push(shuriken);
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

		// powerup
		for (const powerup of this.powerups) {
			if (powerup.destroyed()) {
				continue;
			}
			let isUsed = false;
			for (const playerId of Object.keys(this.ninjaPlayers)) {
				const ninjaPlayer = this.ninjaPlayers[playerId];
				const ninjaSprite = ninjaPlayer.ninja;
				const isHit = g.Collision.intersect(powerup.x + 4, powerup.y + 4, 24, 24, ninjaSprite.x + 4, ninjaSprite.y + 4, 24, 24);
				if (isHit) {
					if (ninjaPlayer.shotInterval > 1) {
						ninjaPlayer.shotInterval--;
						this.createPowerupEffect(ninjaSprite);
					}
					isUsed = true;
					scene.asset.getAudioById("powerup07").play();
				}
			}
			if (isUsed) {
				this.destroySprite(powerup);
			}
		}

		// move shuriken
		for (const shuriken of this.shurikens) {
			shuriken.x += 4;
			if (shuriken.x > 480 - 16) {
				this.destroySprite(shuriken);
			}
		}
		// player attack to enemy
		for (const shuriken of this.shurikens) {
			for (const sprite of this.enemySprites) {
				if (sprite.destroyed()) {
					continue;
				}
				const isHit = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, sprite.x, sprite.y, 24, 24);
				if (!shuriken.destroyed() && isHit) {
					scene.asset.getAudioById("explosionSE").play();
					this.explode(scene, sprite.x, sprite.y);
					if (this.xorshift.generate() * 2 < 1) {
						this.createPowerupItem(sprite.x, sprite.y);
					}
					this.destroySprite(shuriken);
					this.destroySprite(sprite);
				}
			}
		}
		// player attack to boss
		for (const shuriken of this.shurikens) {
			if (this.bossSprite.destroyed()) {
				continue;
			}

			const isHitHead = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, this.bossSprite.x + 6, this.bossSprite.y + 20, 64, 36);
			const isHitBody = g.Collision.intersect(shuriken.x + 4, shuriken.y + 4, 24, 24, this.bossSprite.x + 71, this.bossSprite.y + 44, 104, 40);

			if (!shuriken.destroyed() && (isHitHead || isHitBody)) {
				scene.asset.getAudioById("explosionSE").play();
				this.explode(scene, shuriken.x, shuriken.y);
				this.destroySprite(shuriken);

				this.bossHP--;
				if (!this.isEnemyDead && this.bossHP <= 0) {
					this.isEnemyDead = true;
					this.explosionCount = 100;
					scene.asset.getAudioById("se_maoudamashii_retro30").play();
				}
			}
		}

		// player hit enemy
		for (const playerId of Object.keys(this.ninjaPlayers)) {
			const ninjaPlayer = this.ninjaPlayers[playerId];
			const ninjaSprite = ninjaPlayer.ninja;
			for (const sprite of this.enemySprites) {
				if (sprite.destroyed()) {
					continue;
				}
				const isHit = g.Collision.intersect(ninjaSprite.x + 4, ninjaSprite.y + 4, 24, 24, sprite.x, sprite.y, 24, 24);
				if (isHit && ninjaPlayer.zombie <= 0) {
					this.explode(scene, ninjaSprite.x, ninjaSprite.y);
					scene.asset.getAudioById("explosionSE").play();
					ninjaPlayer.zombie = this.game.fps * 5;
					ninjaPlayer.shotInterval = 20;
				}
			}
		}

		// show boss, move setting
		if (this.bossTween.isFinished()) {
			this.bossTween = this.timeline.create(this.bossSprite, { loop: true })
				.moveY(80, 7000)
				.moveY(80, 3000)
				.moveY(320, 7000)
				.moveY(320, 3000);
		}
		if (this.bossSprite.x < 480 && !this.isShowBoss) {
			this.isShowBoss = true;
			this.groundScrollTween.cancel();
			scene.asset.getAudioById("game_maoudamashii_1_battle01").stop();
			scene.asset.getAudioById("game_maoudamashii_2_boss08").play();
		}

		// boss attack
		if (this.enemyAttackTime > 0 && !this.isEnemyDead) {
			this.enemyAttackTime--;
			if (this.enemyAttackTime === 0) {
				this.enemyAttackTime = Math.floor(this.xorshift.generate() * 50 + 100);
				for (const playerId of Object.keys(this.ninjaPlayers)) {
					const ninjaPlayer = this.ninjaPlayers[playerId];
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
						x: this.bossSprite.x + 10,
						y: this.bossSprite.y + 16,
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
					for (let i = 0; i < this.enemyBullets.length; i++) {
						if (this.enemyBullets[i].enemyBullet.destroyed()) {
							this.enemyBullets.splice(i, 1);
							i--;
						}
					}

					const enemyBulletR = Math.atan2(ninjaPlayer.ninja.y - enemyBullet.y, ninjaPlayer.ninja.x - enemyBullet.x);
					this.enemyBullets.push({ enemyBullet, r: enemyBulletR });
				}
			}
		}
		// hit to player
		for (const e of this.enemyBullets) {
			if (e.enemyBullet.destroyed()) { // いったんこれで
				continue;
			}
			const enemyBullet = e.enemyBullet;
			const enemyBulletR = e.r;
			enemyBullet.x += Math.cos(enemyBulletR) * 3;
			enemyBullet.y += Math.sin(enemyBulletR) * 3;
			let isHit = false;

			for (const playerId of Object.keys(this.ninjaPlayers)) {
				const ninjaSprite = this.ninjaPlayers[playerId].ninja;
				if (
					this.ninjaPlayers[playerId].zombie === 0 &&
					g.Collision.intersect(ninjaSprite.x + 4, ninjaSprite.y + 4, 24, 24, enemyBullet.x + 4, enemyBullet.y + 4, 24, 24)
				) {
					isHit = true;
					this.explode(scene, ninjaSprite.x, ninjaSprite.y);
					scene.asset.getAudioById("explosionSE").play();
					this.ninjaPlayers[playerId].zombie = this.game.fps * 5;
					this.ninjaPlayers[playerId].shotInterval = 20;
					if (playerId === this.game.selfId) {
						//scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
					}
				}
			}
			if (isHit) {
				this.destroySprite(enemyBullet);
			}
		}

		// boss explosion
		if (this.explosionCount > 0) {
			this.explode(
				scene,
				this.bossSprite.x + this.xorshift.generate() * this.bossSprite.width,
				this.bossSprite.y + this.xorshift.generate() * this.bossSprite.height
			);
			this.explosionCount--;
			if (this.explosionCount === 0) {
				//this.bossSprite.hide();
				this.destroySprite(this.bossSprite);
				scene.asset.getAudioById("game_maoudamashii_2_boss08").stop();
				scene.asset.getAudioById("game_maoudamashii_9_jingle05").play();
			}
		}

		// result
		if (this.isEnemyDead && this.explosionCount <= 0) {
			this.winLabel.show();
		}
	}

	createShuriken(scene: g.Scene): g.FrameSprite {
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

	destroySprite(sprite: g.Sprite): void {
		if (!sprite.destroyed()) {
			sprite.destroy();
		}
	}

	explode(scene: g.Scene, x: number, y: number): void {
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

	createPowerupItem(x: number, y: number): void {
		const powerup = new g.FrameSprite({
			scene: this,
			src: this.asset.getImageById("powerup"),
			width: 32,
			height: 32,
			srcWidth: 32,
			srcHeight: 32,
			x: x,
			y: y,
			frames: [2, 3],
			loop: true,
			interval: 200
		});
		powerup.start();
		this.powerups.push(powerup);
		this.groundLayer.append(powerup);
		this.timeline.create(powerup, { loop: false })
			.moveX(-32, (x + 32) * 2000 / this.game.fps);
	}

	createPowerupEffect(sprite: g.Sprite): void {
		const effect = new g.FrameSprite({
			scene: this,
			src: this.asset.getImageById("powerup_effect"),
			width: 32,
			height: 32,
			srcWidth: 32,
			srcHeight: 32,
			x: sprite.x,
			y: sprite.y,
			frames: [0, 1, 2],
			loop: false,
			interval: 200
		});
		effect.start();
		this.characterLayer.append(effect);
		this.onUpdate.add(function () {
			effect.x = sprite.x;
			effect.y = sprite.y;
			if (effect.frameNumber === 2) {
				effect.destroy();
				return true;
			}
			return false;
		});
	}
}

export = MainScene;
