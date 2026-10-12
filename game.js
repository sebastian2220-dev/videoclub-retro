const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;

class EntradaScene extends Phaser.Scene {
  constructor() {
    super('Entrada');
  }

  preload() {
    this.load.image('entrada', 'assets/entrada.webp');
    this.load.image('botonEntrar', 'assets/boton_entrar.webp');
  }

  create() {
    // Fondo a 1920x1080 sin deformar la lógica del juego.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'entrada')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Botón independiente. Partimos de una escala fija y solo animamos
    // el mismo objeto: no hay imágenes gigantes ni cambios bruscos.
    const entrar = this.add.image(960, 890, 'botonEntrar')
      .setDisplaySize(620, 207)
      .setInteractive({ useHandCursor: true });

    // Guardamos el tamaño base para que el hover siempre vuelva exactamente
    // al mismo estado.
    const baseScaleX = entrar.scaleX;
    const baseScaleY = entrar.scaleY;
    const baseY = entrar.y;

    entrar.on('pointerover', () => {
      this.tweens.killTweensOf(entrar);
      this.tweens.add({
        targets: entrar,
        scaleX: baseScaleX * 1.055,
        scaleY: baseScaleY * 1.055,
        y: baseY - 10,
        duration: 150,
        ease: 'Back.Out'
      });
    });

    entrar.on('pointerout', () => {
      this.tweens.killTweensOf(entrar);
      this.tweens.add({
        targets: entrar,
        scaleX: baseScaleX,
        scaleY: baseScaleY,
        y: baseY,
        duration: 130,
        ease: 'Sine.Out'
      });
    });

    entrar.on('pointerdown', () => {
      this.tweens.killTweensOf(entrar);
      this.tweens.add({
        targets: entrar,
        scaleX: baseScaleX * 0.98,
        scaleY: baseScaleY * 0.98,
        y: baseY + 3,
        duration: 70,
        yoyo: true,
        ease: 'Sine.InOut',
        onComplete: () => this.scene.start('Hall')
      });
    });
  }
}

class HallScene extends Phaser.Scene {
  constructor() {
    super('Hall');
  }

  create() {
    // Esta escena es deliberadamente mínima por ahora. Primero dejamos
    // la Entrada con calidad final; después construimos el Hall sobre esa base.
    this.cameras.main.setBackgroundColor('#11101a');

    this.add.text(960, 475, 'VIDECLUB RETRO', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '88px',
      color: '#ffd54a',
      stroke: '#5b1600',
      strokeThickness: 10
    }).setOrigin(0.5);

    this.add.text(960, 585, 'Hall — siguiente etapa', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const volver = this.add.text(70, 60, '← Volver', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 18, y: 12 }
    }).setInteractive({ useHandCursor: true });

    volver.on('pointerdown', () => this.scene.start('Entrada'));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#080910',
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [EntradaScene, HallScene]
};

new Phaser.Game(config);
