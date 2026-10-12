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

    // Crea una copia exacta de una zona del dibujo original. De esta forma
    // animamos a LA MISMA mujer sin generar otro personaje ni cambiar estilo.
    const makePieceTexture = (key, rect) => {
      if (scene.textures.exists(key)) return;

      const sw = Math.max(1, Math.round(rect.width * sourceScaleX));
      const sh = Math.max(1, Math.round(rect.height * sourceScaleY));
      const sx = Math.round(rect.x * sourceScaleX);
      const sy = Math.round(rect.y * sourceScaleY);

      const texture = scene.textures.createCanvas(key, sw, sh);
      const ctx = texture.getContext();
      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
      texture.refresh();
    };

    const makeAnimatedPiece = ({ key, rect, pivot, mask, depth }) => {
      makePieceTexture(key, rect);

      // El pivote se expresa en coordenadas de la escena y luego se convierte
      // al origen local del recorte.
      const localPivotX = (pivot.x - rect.x) / rect.width;
      const localPivotY = (pivot.y - rect.y) / rect.height;

      const piece = scene.add.image(pivot.x, pivot.y, key)
        .setDisplaySize(rect.width, rect.height)
        .setOrigin(localPivotX, localPivotY)
        .setDepth(depth);

      // Máscara suave para que el recorte se funda con el fondo y no se vea
      // como un rectángulo cuando se mueve unos pocos píxeles.
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
      piece.__baseX = piece.x;
      piece.__baseY = piece.y;
      piece.__baseScaleX = piece.scaleX;
      piece.__baseScaleY = piece.scaleY;

      return piece;
    };

    // -----------------------------------------------------------------------
    // 1) RESPIRACIÓN: ahora sí visible, pero con la cintura como ancla.
    // -----------------------------------------------------------------------
    const torso = makeAnimatedPiece({
      key: 'woman-torso-idle',
      rect: { x: 70, y: 520, width: 390, height: 390 },
      pivot: { x: 250, y: 865 },
      mask: { x: 255, y: 705, width: 440, height: 455 },
      depth: 14
    });

    scene.tweens.add({
      targets: torso,
      scaleY: {
        from: torso.__baseScaleY * 0.990,
        to: torso.__baseScaleY * 1.016
      },
      scaleX: {
        from: torso.__baseScaleX * 1.004,
        to: torso.__baseScaleX * 0.997
      },
      y: {
        from: torso.__baseY + 2,
        to: torso.__baseY - 3
      },
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 2) CABEZA: un micro balanceo hace que el personaje deje de estar tieso.
    // -----------------------------------------------------------------------
    const head = makeAnimatedPiece({
      key: 'woman-head-idle',
      rect: { x: 70, y: 330, width: 320, height: 300 },
      pivot: { x: 220, y: 590 },
      mask: { x: 225, y: 455, width: 355, height: 345 },
      depth: 15
    });

    scene.tweens.add({
      targets: head,
      angle: { from: -0.45, to: 0.55 },
      y: { from: head.__baseY + 1, to: head.__baseY - 3 },
      duration: 2050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 3) PELO: la cola se mueve un poco más que la cabeza.
    // -----------------------------------------------------------------------
    const ponytail = makeAnimatedPiece({
      key: 'woman-hair-idle',
      rect: { x: 0, y: 275, width: 230, height: 430 },
      pivot: { x: 165, y: 390 },
      mask: { x: 105, y: 480, width: 270, height: 455 },
      depth: 16
    });

    scene.tweens.add({
      targets: ponytail,
      angle: { from: -1.15, to: 1.30 },
      x: { from: ponytail.__baseX - 2, to: ponytail.__baseX + 3 },
      duration: 1750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 4) BRAZO QUE PRESENTA LA ENTRADA: gesto mínimo y periódico.
    // -----------------------------------------------------------------------
    const arm = makeAnimatedPiece({
      key: 'woman-arm-idle',
      rect: { x: 300, y: 570, width: 330, height: 210 },
      pivot: { x: 325, y: 620 },
      mask: { x: 455, y: 670, width: 385, height: 235 },
      depth: 15
    });

    scene.tweens.add({
      targets: arm,
      angle: { from: -0.55, to: 0.75 },
      y: { from: arm.__baseY + 2, to: arm.__baseY - 2 },
      duration: 1800,
      delay: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // -----------------------------------------------------------------------
    // 5) PESTAÑEO: más frecuente y un poco más largo para que se vea.
    // -----------------------------------------------------------------------
    const eyelid = scene.add.graphics()
      .setDepth(19)
      .setVisible(false);

    const drawClosedEye = () => {
      eyelid.clear();

      // Cubre el ojo abierto con tono de piel antes de dibujar el párpado.
      eyelid.fillStyle(0xffad73, 1);
      eyelid.fillEllipse(282, 440, 40, 42);

      eyelid.lineStyle(6, 0x32100c, 1);
      eyelid.beginPath();
      eyelid.moveTo(264, 438);
      eyelid.quadraticBezierTo(282, 451, 299, 439);
      eyelid.strokePath();

      eyelid.lineStyle(3, 0x32100c, 1);
      eyelid.beginPath();
      eyelid.moveTo(296, 440);
      eyelid.lineTo(304, 436);
      eyelid.moveTo(296, 442);
      eyelid.lineTo(304, 443);
      eyelid.strokePath();
    };

    drawClosedEye();

    const blinkOnce = () => {
      eyelid.setVisible(true);

      scene.time.delayedCall(145, () => {
        eyelid.setVisible(false);
        scene.time.delayedCall(
          Phaser.Math.Between(1500, 3000),
          blinkOnce
        );
      });
    };

    // Primer blink rápido para que sea fácil comprobarlo al abrir la página.
    scene.time.delayedCall(1050, blinkOnce);

    scene.__womanIdleObjects = {
      torso,
      head,
      ponytail,
      arm,
      eyelid
    };

    return true;
  };

  const timer = window.setInterval(() => {
    if (waitForEntrada()) {
      window.clearInterval(timer);
    }
  }, 100);
})();
