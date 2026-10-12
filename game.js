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
    // Fondo base: seguimos usando la entrada cartoon original.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'entrada')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Iluminación viva por encima del fondo.
    this.createNeonAtmosphere();

    // Botón independiente. Se mantiene mientras terminamos la base limpia.
    const entrar = this.add.image(960, 890, 'botonEntrar')
      .setDisplaySize(620, 207)
      .setInteractive({ useHandCursor: true });

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

  createNeonAtmosphere() {
    const ADD = Phaser.BlendModes.ADD;

    // Resplandor cálido muy sutil sobre el gran cartel superior.
    const marqueeGlow = this.add.rectangle(960, 205, 1040, 245, 0xffa73a, 0.035)
      .setBlendMode(ADD);

    const marqueeEdge = this.add.rectangle(960, 205, 1005, 215)
      .setStrokeStyle(9, 0xffbd4a, 0.20)
      .setBlendMode(ADD);

    // Brillo azul alrededor de RETRO. No tapa el arte, solo refuerza la luz.
    const retroGlow = this.add.rectangle(960, 292, 515, 72)
      .setStrokeStyle(10, 0x2cdcff, 0.14)
      .setBlendMode(ADD);

    // Barras rosas laterales del letrero.
    const pinkLeft = this.add.rectangle(652, 304, 180, 15, 0xff41d7, 0.12)
      .setBlendMode(ADD);
    const pinkRight = this.add.rectangle(1268, 304, 180, 15, 0xff41d7, 0.12)
      .setBlendMode(ADD);

    // Cartel ABIERTO: glow independiente para que parezca tubo real.
    const openPink = this.add.rectangle(1086, 540, 182, 66)
      .setStrokeStyle(9, 0xff3cae, 0.18)
      .setAngle(-2.5)
      .setBlendMode(ADD);
    const openBlue = this.add.rectangle(1086, 540, 202, 82)
      .setStrokeStyle(8, 0x25c9ff, 0.12)
      .setAngle(-2.5)
      .setBlendMode(ADD);

    // Luces cálidas de fachada. Son halos pequeños y discretos.
    const lampPositions = [
      [594, 78], [967, 74], [1245, 76], [288, 104], [1590, 118],
      [478, 111], [528, 111], [580, 111], [632, 111], [684, 111],
      [736, 111], [788, 111], [840, 111], [892, 111], [944, 111],
      [996, 111], [1048, 111], [1100, 111], [1152, 111], [1204, 111],
      [1256, 111], [1308, 111], [1360, 111], [1412, 111]
    ];

    const bulbs = lampPositions.map(([x, y], index) => {
      const radius = index < 5 ? 34 : 12;
      return this.add.circle(x, y, radius, 0xffd36a, index < 5 ? 0.055 : 0.075)
        .setBlendMode(ADD);
    });

    // Respiración lenta del neón principal.
    this.tweens.add({
      targets: [marqueeGlow, marqueeEdge, retroGlow, pinkLeft, pinkRight],
      alpha: { from: 0.72, to: 1 },
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // ABIERTO tiene una pulsación distinta para que la escena no parezca sincronizada.
    this.tweens.add({
      targets: [openPink, openBlue],
      alpha: { from: 0.68, to: 1 },
      duration: 930,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // Los focos respiran de forma ligeramente desfasada.
    bulbs.forEach((bulb, index) => {
      this.tweens.add({
        targets: bulb,
        alpha: { from: 0.45, to: 1 },
        duration: 1100 + (index % 5) * 120,
        delay: (index % 7) * 75,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    });

    // Flicker corto e irregular, como tubo de neón real. Es ocasional,
    // no un parpadeo constante que canse la vista.
    const flickerTargets = [pinkLeft, pinkRight, openPink, retroGlow];
    const scheduleFlicker = () => {
      const target = Phaser.Utils.Array.GetRandom(flickerTargets);
      const normalAlpha = target.alpha;

      this.tweens.add({
        targets: target,
        alpha: 0.18,
        duration: 45,
        yoyo: true,
        repeat: Phaser.Math.Between(1, 2),
        ease: 'Linear',
        onComplete: () => {
          target.setAlpha(normalAlpha);
          this.time.delayedCall(Phaser.Math.Between(2200, 6200), scheduleFlicker);
        }
      });
    };

    this.time.delayedCall(Phaser.Math.Between(1200, 2600), scheduleFlicker);
  }
}

class HallScene extends Phaser.Scene {
  constructor() {
    super('Hall');
  }

  create() {
    // El Hall sigue deliberadamente en pausa: primero terminamos la Entrada.
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
