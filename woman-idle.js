(() => {
  const GAME_WIDTH = 1920;
  const GAME_HEIGHT = 1080;

  const waitForEntrada = () => {
    const game = Phaser.GAMES && Phaser.GAMES[0];
    if (!game) return false;

    let scene;
    try {
      scene = game.scene.getScene('Entrada');
    } catch (_) {
      return false;
    }

    if (
      !scene ||
      !scene.sys ||
      !scene.sys.isActive() ||
      !scene.textures.exists('entrada') ||
      !scene.textures.exists('soft-light')
    ) {
      return false;
    }

    if (scene.__womanIdleReady) return true;
    scene.__womanIdleReady = true;

    const source = scene.textures.get('entrada').getSourceImage();
    const sourceScaleX = source.width / GAME_WIDTH;
    const sourceScaleY = source.height / GAME_HEIGHT;

    // Duplica una zona exacta del fondo y la mueve apenas. Como la copia sale
    // de la misma ilustración, la mujer conserva exactamente el mismo estilo.
    const makeAnimatedPiece = ({
      rect,
      pivot,
      mask,
      depth = 14
    }) => {
      const piece = scene.add.image(pivot.x, pivot.y, 'entrada')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setOrigin(pivot.x / GAME_WIDTH, pivot.y / GAME_HEIGHT)
        .setCrop(
          rect.x * sourceScaleX,
          rect.y * sourceScaleY,
          rect.width * sourceScaleX,
          rect.height * sourceScaleY
        )
        .setDepth(depth);

      // Una máscara degradada evita que el borde del recorte se vea como un
      // rectángulo pegado sobre la escena.
      const maskImage = scene.make.image({
        x: mask.x,
        y: mask.y,
        key: 'soft-light',
        add: false
      }).setDisplaySize(mask.width, mask.height);

      const bitmapMask = maskImage.createBitmapMask();
      piece.setMask(bitmapMask);

      piece.__maskImage = maskImage;
      piece.__bitmapMask = bitmapMask;
      piece.__baseScaleX = piece.scaleX;
      piece.__baseScaleY = piece.scaleY;

      return piece;
    };

    // -----------------------------------------------------------------------
    // 1) RESPIRACIÓN
    // -----------------------------------------------------------------------
    // Solo movemos mínimamente torso/cintura. El punto de giro está cerca de
    // la cintura, así la parte superior "respira" sin hacer flotar al personaje.
    const torso = makeAnimatedPiece({
      rect: { x: 55, y: 535, width: 430, height: 330 },
      pivot: { x: 248, y: 805 },
      mask: { x: 250, y: 690, width: 430, height: 360 },
      depth: 14
    });

    scene.tweens.add({
      targets: torso,
      scaleY: {
        from: torso.__baseScaleY * 0.998,
        to: torso.__baseScaleY * 1.006
      },
      scaleX: {
        from: torso.__baseScaleX * 1.001,
        to: torso.__baseScaleX * 0.999
      },
      duration: 1850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 2) PELO / COLA
    // -----------------------------------------------------------------------
    // Movimiento muy corto alrededor del punto donde está recogido el pelo.
    const ponytail = makeAnimatedPiece({
      rect: { x: 0, y: 275, width: 245, height: 390 },
      pivot: { x: 173, y: 372 },
      mask: { x: 112, y: 465, width: 285, height: 430 },
      depth: 15
    });

    scene.tweens.add({
      targets: ponytail,
      angle: { from: -0.28, to: 0.34 },
      scaleX: {
        from: ponytail.__baseScaleX * 0.999,
        to: ponytail.__baseScaleX * 1.002
      },
      duration: 2350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 3) PESTAÑEO
    // -----------------------------------------------------------------------
    // La ilustración ya tiene un ojo guiñado. Para el blink cubrimos durante
    // unas décimas el ojo abierto y dibujamos encima una línea de pestañas.
    const eyelid = scene.add.graphics()
      .setDepth(18)
      .setVisible(false);

    const drawClosedEye = () => {
      eyelid.clear();

      // Tono tomado de la piel de la ilustración alrededor del ojo.
      eyelid.fillStyle(0xffae70, 1);
      eyelid.fillEllipse(281, 458, 36, 38);

      // Párpado cerrado.
      eyelid.lineStyle(6, 0x2f0b08, 1);
      eyelid.beginPath();
      eyelid.moveTo(265, 456);
      eyelid.lineTo(273, 461);
      eyelid.lineTo(282, 463);
      eyelid.lineTo(291, 458);
      eyelid.strokePath();

      // Dos pestañitas pequeñas para mantener el lenguaje cartoon.
      eyelid.lineStyle(3, 0x2f0b08, 1);
      eyelid.beginPath();
      eyelid.moveTo(289, 458);
      eyelid.lineTo(296, 455);
      eyelid.moveTo(289, 460);
      eyelid.lineTo(296, 461);
      eyelid.strokePath();
    };

    drawClosedEye();

    const blinkOnce = () => {
      eyelid.setVisible(true);

      scene.time.delayedCall(105, () => {
        eyelid.setVisible(false);
        scene.time.delayedCall(
          Phaser.Math.Between(2100, 4200),
          blinkOnce
        );
      });
    };

    // Este primer pestañeo también permite que la revisión automática lo
    // capture de forma reproducible.
    scene.time.delayedCall(1625, blinkOnce);

    // Un micro balanceo del conjunto de luces sobre la cara evita que el
    // personaje quede visualmente desconectado de los neones que ya animamos.
    const faceWarmth = scene.add.image(250, 505, 'soft-light')
      .setDisplaySize(250, 290)
      .setTint(0xff9a58)
      .setAlpha(0.018)
      .setDepth(13)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: faceWarmth,
      alpha: { from: 0.010, to: 0.026 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    scene.__womanIdleObjects = {
      torso,
      ponytail,
      eyelid,
      faceWarmth
    };

    return true;
  };

  const timer = window.setInterval(() => {
    if (waitForEntrada()) {
      window.clearInterval(timer);
    }
  }, 100);
})();
