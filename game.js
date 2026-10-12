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
    // 1) FONDO: mantenemos la entrada cartoon original.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'entrada')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    // 2) Creamos una textura de luz con degradado suave.
    // La generamos con código, así no necesitamos otra imagen externa.
    this.createLightingTextures();

    // 3) Añadimos halo + luz proyectada + reflejos.
    this.createNeonAtmosphere();

    // 4) BOTÓN ENTRAR independiente.
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
  // TEXTURA DE LUZ
  // ---------------------------------------------------------------------------
  // En la versión anterior la luz se construía con elipses superpuestas.
  // Funcionaba, pero podían distinguirse círculos. Ahora usamos un degradado
  // radial real: centro brillante y borde completamente transparente.
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
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.82)');
    gradient.addColorStop(0.42, 'rgba(255,255,255,0.42)');
    gradient.addColorStop(0.70, 'rgba(255,255,255,0.13)');
    gradient.addColorStop(1.00, 'rgba(255,255,255,0.00)');

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  // Crea una mancha de luz suave. Al estirar la textura podemos simular
  // halos, luz que cae por una pared o reflejos sobre vidrio/piso.
  addGradientLight(x, y, width, height, color, alpha, depth = 5, angle = 0) {
    const light = this.add.image(x, y, 'soft-light')
      .setDisplaySize(width, height)
      .setTint(color)
      .setAlpha(alpha)
      .setDepth(depth)
      .setAngle(angle)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Guardamos la intensidad original para que el pulso y el flicker
    // siempre vuelvan exactamente al brillo correcto.
    light.baseLightAlpha = alpha;
    return light;
  }

  createLightGroup(items) {
    const group = {
      items,
      pulse: 1,
      flicker: 1
    };

    this.refreshLightGroup(group);
    return group;
  }

  refreshLightGroup(group) {
    group.items.forEach(light => {
      light.setAlpha(light.baseLightAlpha * group.pulse * group.flicker);
    });
  }

  addLightPulse(group, min, max, duration, delay = 0) {
    group.pulse = max;

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

  scheduleIrregularFlicker(group, minDelay, maxDelay) {
    const runFlicker = () => {
      this.tweens.add({
        targets: group,
        flicker: 0.28,
        duration: Phaser.Math.Between(35, 65),
        yoyo: true,
        repeat: Phaser.Math.Between(1, 2),
        ease: 'Linear',
        onUpdate: () => this.refreshLightGroup(group),
        onComplete: () => {
          group.flicker = 1;
          this.refreshLightGroup(group);
          this.time.delayedCall(
            Phaser.Math.Between(minDelay, maxDelay),
            runFlicker
          );
        }
      });
    };

    this.time.delayedCall(
      Phaser.Math.Between(minDelay, maxDelay),
      runFlicker
    );
  }

  createNeonAtmosphere() {
    // -------------------------------------------------------------------------
    // A) LETRERO PRINCIPAL: fuente + halo + luz que cae en la fachada.
    // -------------------------------------------------------------------------
    const marqueeHalo = this.addGradientLight(
      960, 205, 1290, 330, 0xffb447, 0.105, 4
    );

    const marqueeDownSpill = this.addGradientLight(
      960, 365, 1220, 330, 0xffc866, 0.060, 3
    );

    const retroBlue = this.addGradientLight(
      960, 292, 650, 145, 0x39d8ff, 0.120, 6
    );

    const retroPink = this.addGradientLight(
      960, 300, 560, 115, 0xff45c7, 0.070, 6
    );

    // Las barras rosas tienen halos propios, pero suaves.
    const pinkLeft = this.addGradientLight(
      650, 304, 270, 70, 0xff3fcf, 0.105, 7
    );

    const pinkRight = this.addGradientLight(
      1270, 304, 270, 70, 0xff3fcf, 0.105, 7
    );

    // Un pequeño rebote de color sobre la zona alta de los vidrios.
    const marqueeGlassBlue = this.addGradientLight(
      835, 415, 430, 180, 0x43cfff, 0.032, 3, -3
    );

    const marqueeGlassPink = this.addGradientLight(
      1110, 415, 410, 180, 0xff45c7, 0.028, 3, 3
    );

    const marqueeGroup = this.createLightGroup([
      marqueeHalo,
      marqueeDownSpill,
      retroBlue,
      retroPink,
      pinkLeft,
      pinkRight,
      marqueeGlassBlue,
      marqueeGlassPink
    ]);

    this.addLightPulse(marqueeGroup, 0.88, 1.00, 1650);

    // -------------------------------------------------------------------------
    // B) CARTEL ABIERTO: fuente + vidrio inmediatamente alrededor.
    // -------------------------------------------------------------------------
    const openPink = this.addGradientLight(
      1085, 540, 270, 125, 0xff45aa, 0.145, 8, -2.5
    );

    const openBlue = this.addGradientLight(
      1085, 540, 325, 165, 0x32cbff, 0.085, 7, -2.5
    );

    // Esta luz es más vertical: simula el color reflejado sobre el vidrio.
    const openGlassBlue = this.addGradientLight(
      1088, 650, 260, 310, 0x46d3ff, 0.045, 4, -1
    );

    const openGlassPink = this.addGradientLight(
      1065, 635, 185, 250, 0xff4eb4, 0.030, 5, 1
    );

    const openGroup = this.createLightGroup([
      openPink,
      openBlue,
      openGlassBlue,
      openGlassPink
    ]);

    this.addLightPulse(openGroup, 0.80, 1.00, 1050, 160);

    // -------------------------------------------------------------------------
    // C) LÁMPARAS: cada una ilumina su pared cercana, no solo la ampolleta.
    // -------------------------------------------------------------------------
    const lamps = [
      // x, y, ancho de derrame, alto de derrame
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

      // Mancha estirada hacia abajo. Al ser un degradado no tiene borde de cono.
      const wallSpill = this.addGradientLight(
        x, y + spillHeight * 0.48,
        spillWidth,
        spillHeight,
        0xffcb73,
        0.043,
        3
      );

      // Rebote más pequeño y cálido cerca del punto donde la luz toca la fachada.
      const wallBounce = this.addGradientLight(
        x,
        y + spillHeight * 0.78,
        spillWidth * 0.72,
        spillHeight * 0.38,
        0xffe0a0,
        0.026,
        4
      );

      const group = this.createLightGroup([source, wallSpill, wallBounce]);
      this.addLightPulse(
        group,
        0.91,
        1.00,
        1700 + index * 145,
        index * 85
      );
      return group;
    });

    // -------------------------------------------------------------------------
    // D) INTERIOR DEL LOCAL: calor saliendo por las puertas y ventanas.
    // -------------------------------------------------------------------------
    const doorWarm = this.addGradientLight(
      960, 635, 520, 450, 0xffbd62, 0.050, 2
    );

    const doorCore = this.addGradientLight(
      960, 610, 340, 320, 0xffe2a0, 0.038, 3
    );

    const leftWindowWarm = this.addGradientLight(
      460, 520, 420, 520, 0xffba64, 0.026, 2
    );

    const rightWindowWarm = this.addGradientLight(
      1390, 520, 430, 520, 0xffba64, 0.026, 2
    );

    const interiorGroup = this.createLightGroup([
      doorWarm,
      doorCore,
      leftWindowWarm,
      rightWindowWarm
    ]);

    this.addLightPulse(interiorGroup, 0.95, 1.00, 2500, 300);

    // -------------------------------------------------------------------------
    // E) REFLEJOS: colores que llegan a la zona baja de la entrada.
    // -------------------------------------------------------------------------
    const floorWarm = this.addGradientLight(
      960, 835, 900, 170, 0xffb85d, 0.045, 3
    );

    const floorBlue = this.addGradientLight(
      820, 858, 560, 95, 0x3ac9ff, 0.026, 4, -2
    );

    const floorPink = this.addGradientLight(
      1110, 858, 520, 90, 0xff42bc, 0.024, 4, 2
    );

    const floorGroup = this.createLightGroup([
      floorWarm,
      floorBlue,
      floorPink
    ]);

    this.addLightPulse(floorGroup, 0.82, 1.00, 1850, 250);

    // Movimiento casi imperceptible: el reflejo cambia de ancho, no de posición.
    this.tweens.add({
      targets: [floorBlue, floorPink],
      scaleX: { from: 0.97, to: 1.035 },
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -------------------------------------------------------------------------
    // F) FLICKER OCASIONAL.
    // Cuando la fuente falla, también cae la luz que proyecta alrededor.
    // -------------------------------------------------------------------------
    this.scheduleIrregularFlicker(openGroup, 3200, 7800);
    this.scheduleIrregularFlicker(marqueeGroup, 6200, 12500);
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
