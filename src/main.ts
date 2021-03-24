// NOTE
//   $ echo ' export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
//   $ source ~/.bash_profile
//
// NOTE: SE,BGMのファイル名にmaoudamashiiが含まれているのはは魔法魂のもの、他のSEは自作(使用ソフトはsfxr)

import MainScene = require('./MainScene');
import TitleScene = require("./TitleScene");

function main(param: g.GameMainParameterObject): void {
	g.game.audio.music.volume = 0.2;
	g.game.audio.sound.volume = 0.2;

	const titleScene = new TitleScene(g.game);
	titleScene.onPointDownCapture.add(function () {
		const mainScene = new MainScene(
			g.game,
			function () {
				g.game.popScene();
			}
		);
		g.game.pushScene(mainScene);
	});
	g.game.pushScene(titleScene);
}

export = main;
