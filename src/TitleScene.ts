
const font = new g.DynamicFont({
	game: g.game,
	fontFamily: "sans-serif",
	size: 64
});

class TitleScreen extends g.Scene {
	constructor(game: g.Game) {
		super({
			game,
			assetIds: []
		});
		this.onLoad.addOnce(this.handleLoad, this);
	}
	handleLoad() {
		const titleLabel = new g.Label({
			scene: this,
			font: font,
			text: "Ninja Burner",
			fontSize: 64,
			textColor: "white",
			x: 10,
			y: 150
		});
		const startLabel = new g.Label({
			scene: this,
			font: font,
			text: "Click to start!",
			fontSize: 32,
			textColor: "white",
			x: 10,
			y: 280
		});
		const rect = new g.FilledRect({
			scene: this,
			cssColor: "black",
			width: 480,
			height: 480
		});
		titleLabel.x = (480 - titleLabel.width) / 2;
		startLabel.x = (480 - startLabel.width) / 2;
		this.append(rect);
		this.append(titleLabel);
		this.append(startLabel);

		/*
		this.onPointDownCapture.add(function () {
			g.game.replaceScene(scene);
			init();
		});
		*/
	}
}

export = TitleScreen;
