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
    // Fondo cartoon original.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'entrada')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    // Textura suave usada por todos los halos y reflejos.
    this.createLightingTextures();

    // Neones: fuente + halo + luz proyectada + comportamiento eléctrico.
    this.createNeonAtmosphere();

    // Botón ENTRAR independiente.
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

  // ---------------------------------------------------------------------------
  // TEXTURAS / HELPERS DE LUZ
  // ---------------------------------------------------------------------------
  createLightingTextures() {
    if (this.textures.exists('soft-light')) return;

    const size = 256;
    const texture = this.textures.createCanvas('soft-light', size, size);
    const ctx = texture.getContext();

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    gradient.addColorStop(0.00, 'rgba(255,255,255,1.00)');
    gradient.addColorStop(0.16, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.40, 'rgba(255,255,255,0.46)');
    gradient.addColorStop(0.70, 'rgba(255,255,255,0.13)');
    gradient.addColorStop(1.00, 'rgba(255,255,255,0.00)');

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  addGradientLight(x, y, width, height, color, alpha, depth = 5, angle = 0) {
    const light = this.add.image(x, y, 'soft-light')
      .setDisplaySize(width, height)
      .setTint(color)
      .setAlpha(alpha)
      .setDepth(depth)
      .setAngle(angle)
      .setBlendMode(Phaser.BlendModes.ADD);

    light.baseLightAlpha = alpha;
    return light;
  }

  // Como el fondo ya trae el neón pintado encendido, usamos un velo oscuro
  // suave para simular que el tubo está apagado antes de que "agarre corriente".
  addNeonDimmer(x, y, width, height, startAlpha = 0.52, restAlpha = 0.025, depth = 10, angle = 0) {
    const dimmer = this.add.image(x, y, 'soft-light')
      .setDisplaySize(width, height)
      .setTint(0x05030a)
      .setAlpha(startAlpha)
      .setDepth(depth)
      .setAngle(angle)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    dimmer.startAlpha = startAlpha;
    dimmer.restAlpha = restAlpha;
    return dimmer;
  }

  createLightGroup(items, name) {
    const group = {
      name,
      items,
      power: 1,
      pulse: 1,
      flicker: 1
    };
    this.refreshLightGroup(group);
    return group;
  }

  refreshLightGroup(group) {
    group.items.forEach(light => {
      light.setAlpha(
        light.baseLightAlpha * group.power * group.pulse * group.flicker
      );
    });
  }

  addLightPulse(group, min, max, duration, delay = 0) {
    this.tweens.add({
      targets: group,
      pulse: { from: min, to: max },
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: () => this.refreshLightGroup(group)
    });
  }

  // Secuencia corta de encendido: intenta prender, falla, vuelve a intentar
  // y finalmente queda estable. El entorno reacciona al mismo tiempo.
  igniteNeon(group, dimmer, delay, pattern = null) {
    const steps = pattern || [
      { power: 0.10, dark: 0.54, hold: 70 },
      { power: 0.62, dark: 0.24, hold: 85 },
      { power: 0.08, dark: 0.56, hold: 55 },
      { power: 0.82, dark: 0.14, hold: 95 },
      { power: 0.28, dark: 0.38, hold: 55 },
      { power: 1.00, dark: dimmer.restAlpha, hold: 150 }
    ];

    group.power = 0.06;
    dimmer.setAlpha(dimmer.startAlpha);
    this.refreshLightGroup(group);

    const runStep = (index) => {
      if (index >= steps.length) {
        group.power = 1;
        dimmer.setAlpha(dimmer.restAlpha);
        this.refreshLightGroup(group);
        return;
      }

      const step = steps[index];
      group.power = step.power;
      dimmer.setAlpha(step.dark);
      this.refreshLightGroup(group);
      this.time.delayedCall(step.hold, () => runStep(index + 1));
    };

    this.time.delayedCall(delay, () => runStep(0));
  }

  // Micro-falla ocasional. No es un parpadeo constante: sucede de vez en cuando
  // y afecta fuente, halo y reflejo juntos.
  scheduleIrregularFlicker(group, minDelay, maxDelay, minPower = 0.18) {
    const runFlicker = () => {
      const normalPower = group.power;
      const burstCount = Phaser.Math.Between(1, 3);
      let burst = 0;

      const blink = () => {
        if (burst >= burstCount) {
          group.flicker = 1;
          group.power = normalPower;
          this.refreshLightGroup(group);
          this.time.delayedCall(
            Phaser.Math.Between(minDelay, maxDelay),
            runFlicker
          );
          return;
        }

        group.flicker = Phaser.Math.FloatBetween(minPower, 0.48);
        this.refreshLightGroup(group);

        this.time.delayedCall(Phaser.Math.Between(35, 70), () => {
          group.flicker = 1;
          this.refreshLightGroup(group);
          burst += 1;
          this.time.delayedCall(Phaser.Math.Between(35, 90), blink);
        });
      };

      blink();
    };

    this.time.delayedCall(
      Phaser.Math.Between(minDelay, maxDelay),
      runFlicker
    );
  }

  createNeonAtmosphere() {
    // -------------------------------------------------------------------------
    // 1) VIDEOCLUB: lo dividimos en tres zonas para que el encendido avance
    // de izquierda a derecha, como un tubo que va tomando corriente.
    // -------------------------------------------------------------------------
    const videoSegmentData = [
      { x: 680, delay: 420 },
      { x: 960, delay: 540 },
      { x: 1240, delay: 665 }
    ];

    const videoSegments = videoSegmentData.map((segment, index) => {
      const source = this.addGradientLight(
        segment.x, 205, 430, 215, 0x66d8ff, 0.120, 7
      );
      const warmCore = this.addGradientLight(
        segment.x, 215, 360, 170, 0xffbb56, 0.070, 7
      );
      const wallSpill = this.addGradientLight(
        segment.x, 350, 470, 300, 0xffc866, 0.035, 3
      );
      const glassBounce = this.addGradientLight(
        segment.x, 430, 370, 170, 0x49d2ff, 0.022, 3
      );

      const group = this.createLightGroup(
        [source, warmCore, wallSpill, glassBounce],
        `VIDEOCLUB-${index + 1}`
      );

      const dimmer = this.addNeonDimmer(
        segment.x, 205, 470, 235, 0.46, 0.018, 9
      );

      this.addLightPulse(group, 0.94, 1.00, 2500 + index * 180, index * 140);
      this.igniteNeon(group, dimmer, segment.delay);
      return { group, dimmer };
    });

    // Fallas raras en zonas distintas del letrero principal.
    this.scheduleIrregularFlicker(videoSegments[1].group, 9000, 17000, 0.25);
    this.scheduleIrregularFlicker(videoSegments[2].group, 12000, 21000, 0.30);

    // -------------------------------------------------------------------------
    // 2) RETRO: más nervioso y colorido que VIDEOCLUB.
    // -------------------------------------------------------------------------
    const retroLeftBlue = this.addGradientLight(
      850, 302, 360, 125, 0x32d8ff, 0.130, 8
    );
    const retroLeftPink = this.addGradientLight(
      850, 304, 330, 105, 0xff45c7, 0.090, 8
    );
    const retroLeftSpill = this.addGradientLight(
      850, 405, 420, 210, 0x49d4ff, 0.030, 4
    );

    const retroRightBlue = this.addGradientLight(
      1080, 302, 360, 125, 0x32d8ff, 0.130, 8
    );
    const retroRightPink = this.addGradientLight(
      1080, 304, 330, 105, 0xff45c7, 0.090, 8
    );
    const retroRightSpill = this.addGradientLight(
      1080, 405, 420, 210, 0xff4fbd, 0.028, 4
    );

    const retroLeftGroup = this.createLightGroup(
      [retroLeftBlue, retroLeftPink, retroLeftSpill],
      'RETRO-IZQ'
    );
    const retroRightGroup = this.createLightGroup(
      [retroRightBlue, retroRightPink, retroRightSpill],
      'RETRO-DER'
    );

    const retroLeftDimmer = this.addNeonDimmer(
      850, 302, 380, 140, 0.52, 0.018, 9
    );
    const retroRightDimmer = this.addNeonDimmer(
      1080, 302, 380, 140, 0.52, 0.018, 9
    );

    this.addLightPulse(retroLeftGroup, 0.86, 1.00, 1450, 70);
    this.addLightPulse(retroRightGroup, 0.84, 1.00, 1570, 210);
    this.igniteNeon(retroLeftGroup, retroLeftDimmer, 880);
    this.igniteNeon(retroRightGroup, retroRightDimmer, 1010);
    this.scheduleIrregularFlicker(retroLeftGroup, 5200, 10500, 0.14);
    this.scheduleIrregularFlicker(retroRightGroup, 6800, 12500, 0.16);

    // -------------------------------------------------------------------------
    // 3) CASSETTE / ICONO NEÓN DERECHO: comportamiento más eléctrico.
    // -------------------------------------------------------------------------
    const cassetteCyan = this.addGradientLight(
      1480, 245, 320, 185, 0x39d8ff, 0.105, 8, 1
    );
    const cassettePink = this.addGradientLight(
      1480, 245, 245, 135, 0xff49c6, 0.072, 8, 1
    );
    const cassetteSpill = this.addGradientLight(
      1450, 390, 370, 260, 0x43d0ff, 0.026, 4, 2
    );

    const cassetteGroup = this.createLightGroup(
      [cassetteCyan, cassettePink, cassetteSpill],
      'CASSETTE'
    );
    const cassetteDimmer = this.addNeonDimmer(
      1480, 245, 335, 195, 0.50, 0.02, 9, 1
    );

    this.addLightPulse(cassetteGroup, 0.84, 1.00, 1320, 300);
    this.igniteNeon(cassetteGroup, cassetteDimmer, 1220);
    this.scheduleIrregularFlicker(cassetteGroup, 4300, 9800, 0.10);

    // -------------------------------------------------------------------------
    // 4) ABIERTO: clásico, con falla breve y reflejo directo en el vidrio.
    // -------------------------------------------------------------------------
    const openPink = this.addGradientLight(
      1085, 540, 275, 128, 0xff45aa, 0.150, 8, -2.5
    );
    const openBlue = this.addGradientLight(
      1085, 540, 330, 170, 0x32cbff, 0.090, 7, -2.5
    );
    const openGlassBlue = this.addGradientLight(
      1088, 650, 270, 315, 0x46d3ff, 0.050, 4, -1
    );
    const openGlassPink = this.addGradientLight(
      1065, 635, 190, 255, 0xff4eb4, 0.034, 5, 1
    );

    const openGroup = this.createLightGroup(
      [openPink, openBlue, openGlassBlue, openGlassPink],
      'ABIERTO'
    );
    const openDimmer = this.addNeonDimmer(
      1085, 540, 285, 145, 0.58, 0.025, 9, -2.5
    );

    this.addLightPulse(openGroup, 0.82, 1.00, 1120, 160);
    this.igniteNeon(openGroup, openDimmer, 1500, [
      { power: 0.08, dark: 0.58, hold: 80 },
      { power: 0.74, dark: 0.20, hold: 90 },
      { power: 0.06, dark: 0.60, hold: 55 },
      { power: 0.92, dark: 0.09, hold: 110 },
      { power: 0.18, dark: 0.43, hold: 45 },
      { power: 1.00, dark: openDimmer.restAlpha, hold: 160 }
    ]);
    this.scheduleIrregularFlicker(openGroup, 3600, 8600, 0.10);

    // -------------------------------------------------------------------------
    // 5) NEONES DE VITRINA: más discretos, pero no completamente estáticos.
    // -------------------------------------------------------------------------
    const leftWindowNeon = this.addGradientLight(
      485, 470, 390, 185, 0xff58d3, 0.035, 5, -1
    );
    const leftWindowBlue = this.addGradientLight(
      485, 500, 410, 240, 0x41d4ff, 0.022, 4, -1
    );
    const leftWindowGroup = this.createLightGroup(
      [leftWindowNeon, leftWindowBlue],
      'VITRINA-IZQ'
    );

    const rightWindowNeon = this.addGradientLight(
      1390, 470, 430, 190, 0x42d5ff, 0.034, 5, 1
    );
    const rightWindowPink = this.addGradientLight(
      1390, 500, 410, 235, 0xff4dbe, 0.021, 4, 1
    );
    const rightWindowGroup = this.createLightGroup(
      [rightWindowNeon, rightWindowPink],
      'VITRINA-DER'
    );

    this.addLightPulse(leftWindowGroup, 0.88, 1.00, 2200, 500);
    this.addLightPulse(rightWindowGroup, 0.90, 1.00, 2450, 820);
    this.scheduleIrregularFlicker(leftWindowGroup, 11000, 23000, 0.34);
    this.scheduleIrregularFlicker(rightWindowGroup, 13000, 26000, 0.36);

    // -------------------------------------------------------------------------
    // 6) LÁMPARAS CÁLIDAS: iluminan pared / fachada y no hacen flicker de neón.
    // -------------------------------------------------------------------------
    const lamps = [
      [288, 104, 240, 300],
      [594, 78, 250, 260],
      [967, 74, 260, 270],
      [1245, 76, 250, 260],
      [1590, 118, 250, 330]
    ];

    this.lampGroups = lamps.map(([x, y, spillWidth, spillHeight], index) => {
      const source = this.addGradientLight(
        x, y + 5, 150, 120, 0xffd77b, 0.115, 8
      );
      const wallSpill = this.addGradientLight(
        x,
        y + spillHeight * 0.48,
        spillWidth,
        spillHeight,
        0xffcb73,
        0.043,
        3
      );
      const wallBounce = this.addGradientLight(
        x,
        y + spillHeight * 0.78,
        spillWidth * 0.72,
        spillHeight * 0.38,
        0xffe0a0,
        0.026,
        4
      );

      const group = this.createLightGroup(
        [source, wallSpill, wallBounce],
        `LAMPARA-${index + 1}`
      );
      this.addLightPulse(group, 0.92, 1.00, 1800 + index * 150, index * 95);
      return group;
    });

    // -------------------------------------------------------------------------
    // 7) LUZ INTERIOR + REFLEJOS DE PISO.
    // -------------------------------------------------------------------------
    const doorWarm = this.addGradientLight(
      960, 635, 520, 450, 0xffbd62, 0.050, 2
    );
    const doorCore = this.addGradientLight(
      960, 610, 340, 320, 0xffe2a0, 0.038, 3
    );
    const interiorGroup = this.createLightGroup(
      [doorWarm, doorCore],
      'INTERIOR'
    );
    this.addLightPulse(interiorGroup, 0.95, 1.00, 2600, 300);

    const floorWarm = this.addGradientLight(
      960, 835, 900, 170, 0xffb85d, 0.045, 3
    );
    const floorBlue = this.addGradientLight(
      820, 858, 560, 95, 0x3ac9ff, 0.028, 4, -2
    );
    const floorPink = this.addGradientLight(
      1110, 858, 520, 90, 0xff42bc, 0.026, 4, 2
    );

    const floorGroup = this.createLightGroup(
      [floorWarm, floorBlue, floorPink],
      'PISO'
    );
    this.addLightPulse(floorGroup, 0.84, 1.00, 1900, 250);

    this.tweens.add({
      targets: [floorBlue, floorPink],
      scaleX: { from: 0.97, to: 1.035 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
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
