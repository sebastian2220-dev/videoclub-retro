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
    // 1) FONDO: seguimos usando la entrada cartoon original.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'entrada')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    // 2) ILUMINACIÓN: cada luz importante tiene halo + luz proyectada + reflejo.
    this.createNeonAtmosphere();

    // 3) BOTÓN ENTRAR independiente.
    const entrar = this.add.image(960, 890, 'botonEntrar')
      .setDisplaySize(620, 207)
      .setDepth(20)
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

  // Crea un halo suave usando varias elipses superpuestas.
  // Esto evita que la luz parezca un círculo duro pegado sobre el dibujo.
  addSoftGlow(x, y, width, height, color, strength = 0.10, depth = 5) {
    const container = this.add.container(x, y).setDepth(depth);
    const ADD = Phaser.BlendModes.ADD;

    const layers = [
      { scale: 1.00, alpha: strength * 0.24 },
      { scale: 0.78, alpha: strength * 0.34 },
      { scale: 0.56, alpha: strength * 0.48 },
      { scale: 0.34, alpha: strength * 0.68 }
    ];

    layers.forEach(layer => {
      const ellipse = this.add.ellipse(
        0,
        0,
        width * layer.scale,
        height * layer.scale,
        color,
        layer.alpha
      ).setBlendMode(ADD);

      container.add(ellipse);
    });

    return container;
  }

  // Simula un haz que baja desde una lámpara superior.
  addLightCone(x, y, width, height, color, strength = 0.05, depth = 4) {
    const container = this.add.container(x, y).setDepth(depth);
    const ADD = Phaser.BlendModes.ADD;

    const coneLayers = [
      { width: width, alpha: strength * 0.35 },
      { width: width * 0.72, alpha: strength * 0.48 },
      { width: width * 0.46, alpha: strength * 0.65 }
    ];

    coneLayers.forEach(layer => {
      const points = [
        0, 0,
        -layer.width / 2, height,
        layer.width / 2, height
      ];

      const cone = this.add.polygon(0, 0, points, color, layer.alpha)
        .setOrigin(0.5, 0)
        .setBlendMode(ADD);

      container.add(cone);
    });

    return container;
  }

  createNeonAtmosphere() {
    const ADD = Phaser.BlendModes.ADD;

    // =========================================================
    // A) LETRERO PRINCIPAL VIDEOCLUB / RETRO
    // =========================================================

    // Fuente: halo pegado al cartel.
    const marqueeSource = this.addSoftGlow(
      960, 215, 1100, 250, 0xffb447, 0.20, 5
    );

    // Luz proyectada: el cartel ilumina la fachada justo debajo.
    const marqueeSpill = this.addSoftGlow(
      960, 345, 1280, 300, 0xffc866, 0.11, 4
    );

    // Refuerzo azul/rosado de la palabra RETRO.
    const retroBlue = this.addSoftGlow(
      960, 300, 610, 120, 0x2fd8ff, 0.14, 6
    );

    const retroPink = this.addSoftGlow(
      960, 300, 520, 95, 0xff44c8, 0.10, 6
    );

    // Dos barras rosas laterales del letrero.
    const pinkLeft = this.add.rectangle(652, 304, 185, 16, 0xff45d5, 0.18)
      .setDepth(7)
      .setBlendMode(ADD);

    const pinkRight = this.add.rectangle(1268, 304, 185, 16, 0xff45d5, 0.18)
      .setDepth(7)
      .setBlendMode(ADD);

    // =========================================================
    // B) CARTEL ABIERTO
    // =========================================================

    // Fuente del cartel.
    const openSource = this.addSoftGlow(
      1085, 540, 250, 120, 0xff42aa, 0.18, 7
    );

    // Halo azulado exterior.
    const openBlue = this.addSoftGlow(
      1085, 540, 315, 155, 0x2fcfff, 0.10, 6
    );

    // La luz del cartel se refleja en el vidrio de abajo.
    const openGlassSpill = this.addSoftGlow(
      1088, 655, 250, 300, 0x5bd8ff, 0.075, 4
    );

    // Una pequeña mancha rosa mezclada en el vidrio para que no sea plano.
    const openGlassPink = this.addSoftGlow(
      1088, 650, 180, 225, 0xff4db2, 0.045, 5
    );

    // =========================================================
    // C) LÁMPARAS SUPERIORES DE LA FACHADA
    // =========================================================

    // Tomamos focos grandes visibles en la ilustración.
    const lampPositions = [
      [288, 104],
      [594, 78],
      [967, 74],
      [1245, 76],
      [1590, 118]
    ];

    const lampGroups = lampPositions.map(([x, y], index) => {
      // Halo justo alrededor de la ampolleta.
      const source = this.addSoftGlow(
        x, y, 130, 95, 0xffd67a, 0.18, 8
      );

      // Haz que baja por la pared.
      const cone = this.addLightCone(
        x, y + 14, 230, 360, 0xffcf72, 0.055, 3
      );

      // Mancha de luz donde el haz termina, cerca de la zona inferior.
      const pool = this.addSoftGlow(
        x, 720, 300, 180, 0xffc76d, 0.055, 3
      );

      // Cada lámpara respira con un tiempo diferente.
      this.tweens.add({
        targets: [source, cone, pool],
        alpha: { from: 0.78, to: 1 },
        duration: 1350 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });

      return { source, cone, pool };
    });

    // =========================================================
    // D) LUZ INTERIOR DEL LOCAL
    // =========================================================

    // El interior cálido también debe iluminar el marco de las puertas.
    const doorWarmGlow = this.addSoftGlow(
      960, 665, 520, 420, 0xffc36a, 0.075, 3
    );

    // Un segundo halo más pequeño da sensación de profundidad interior.
    const doorInnerGlow = this.addSoftGlow(
      960, 620, 330, 320, 0xffe19a, 0.065, 4
    );

    // =========================================================
    // E) REFLEJOS EN PISO / VEREDA
    // =========================================================

    // Reflejo cálido general que llega desde la entrada.
    const floorWarm = this.addSoftGlow(
      960, 910, 880, 160, 0xffbd62, 0.075, 3
    );

    // Reflejo azul y rosado del neón principal.
    const floorBlue = this.addSoftGlow(
      850, 935, 620, 95, 0x38ccff, 0.050, 3
    );

    const floorPink = this.addSoftGlow(
      1080, 940, 560, 90, 0xff43c0, 0.042, 3
    );

    // Líneas finas de reflexión: imitan una superficie algo brillante.
    const reflectionBlue = this.add.rectangle(850, 905, 430, 7, 0x55d7ff, 0.075)
      .setDepth(4)
      .setBlendMode(ADD)
      .setAngle(-1.2);

    const reflectionPink = this.add.rectangle(1085, 930, 350, 6, 0xff58c9, 0.070)
      .setDepth(4)
      .setBlendMode(ADD)
      .setAngle(1.4);

    // =========================================================
    // F) ANIMACIÓN DE LA ILUMINACIÓN
    // =========================================================

    // El gran letrero respira lentamente.
    this.tweens.add({
      targets: [marqueeSource, marqueeSpill, retroBlue, retroPink],
      alpha: { from: 0.82, to: 1 },
      duration: 1550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // ABIERTO tiene su propio ritmo.
    this.tweens.add({
      targets: [openSource, openBlue, openGlassSpill, openGlassPink],
      alpha: { from: 0.72, to: 1 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // El interior del local cambia muy poco, como iluminación eléctrica real.
    this.tweens.add({
      targets: [doorWarmGlow, doorInnerGlow],
      alpha: { from: 0.88, to: 1 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // Los reflejos del piso "respiran" con el neón.
    this.tweens.add({
      targets: [floorWarm, floorBlue, floorPink],
      alpha: { from: 0.76, to: 1 },
      scaleX: { from: 0.985, to: 1.015 },
      duration: 1750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this.tweens.add({
      targets: [reflectionBlue, reflectionPink],
      alpha: { from: 0.45, to: 1 },
      scaleX: { from: 0.92, to: 1.08 },
      duration: 1350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // =========================================================
    // G) FLICKER IRREGULAR: fuente Y entorno reaccionan juntos.
    // =========================================================

    const flickerSets = [
      [retroPink, marqueeSpill],
      [pinkLeft, retroPink],
      [pinkRight, retroPink],
      [openSource, openGlassSpill]
    ];

    const scheduleFlicker = () => {
      const targets = Phaser.Utils.Array.GetRandom(flickerSets);

      this.tweens.add({
        targets,
        alpha: 0.28,
        duration: 45,
        yoyo: true,
        repeat: Phaser.Math.Between(1, 2),
        ease: 'Linear',
        onComplete: () => {
          targets.forEach(target => target.setAlpha(1));
          this.time.delayedCall(
            Phaser.Math.Between(2800, 7600),
            scheduleFlicker
          );
        }
      });
    };

    this.time.delayedCall(
      Phaser.Math.Between(1600, 3400),
      scheduleFlicker
    );

    // Evitamos que la variable quede sin uso y documentamos que
    // las lámparas ya tienen animación individual arriba.
    this.lampGroups = lampGroups;
  }
}

class HallScene extends Phaser.Scene {
  constructor() {
    super('Hall');
  }

  create() {
    // El Hall sigue en pausa: primero terminamos la Entrada.
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
