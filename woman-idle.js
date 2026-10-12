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

    if (!scene || !scene.sys || !scene.sys.isActive() || !scene.textures.exists('entrada')) {
      return false;
    }

    if (scene.__womanIdleReady) return true;
    scene.__womanIdleReady = true;

    const source = scene.textures.get('entrada').getSourceImage();
    const sx = source.width / GAME_WIDTH;
    const sy = source.height / GAME_HEIGHT;

    // -----------------------------------------------------------------------
    // CABEZA / PELO REALMENTE SEPARADOS DEL FONDO
    // -----------------------------------------------------------------------
    // Este recorte usa exactamente los píxeles de la ilustración original.
    // La silueta fue trazada alrededor de cabeza y pelo para que no se mueva
    // un rectángulo de fondo junto con el personaje.
    const headRect = { x: 0, y: 270, width: 360, height: 370 };
    const headPolygon = [
      [46,45],[31,100],[38,133],[15,139],[0,130],[0,301],[93,345],
      [111,341],[126,311],[150,291],[184,296],[244,325],[271,325],
      [277,312],[267,297],[301,288],[323,248],[330,208],[318,199],
      [341,118],[300,74],[299,56],[230,55],[227,47],[174,42],
      [131,22],[115,23],[120,37]
    ];

    if (!scene.textures.exists('woman-head-live')) {
      const tex = scene.textures.createCanvas(
        'woman-head-live',
        headRect.width,
        headRect.height
      );
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, headRect.width, headRect.height);
      ctx.imageSmoothingEnabled = true;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(headPolygon[0][0], headPolygon[0][1]);
      for (let i = 1; i < headPolygon.length; i++) {
        ctx.lineTo(headPolygon[i][0], headPolygon[i][1]);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        source,
        headRect.x * sx,
        headRect.y * sy,
        headRect.width * sx,
        headRect.height * sy,
        0,
        0,
        headRect.width,
        headRect.height
      );
      ctx.restore();
      tex.refresh();
    }

    // El pivote está cerca del cuello: así la cabeza se balancea y no flota.
    const pivot = { x: 180, y: 590 };
    const headImage = scene.add.image(0, 0, 'woman-head-live')
      .setOrigin(0, 0)
      .setPosition(headRect.x - pivot.x, headRect.y - pivot.y);

    // Ojo cerrado. Va dentro del mismo contenedor, por eso acompaña el
    // movimiento de la cabeza y no queda clavado en la pantalla.
    const eyelid = scene.add.graphics();
    eyelid.setVisible(false);
    eyelid.fillStyle(0xffad73, 1);
    eyelid.fillEllipse(98, -143, 42, 42);
    eyelid.lineStyle(6, 0x32100c, 1);
    eyelid.beginPath();
    eyelid.moveTo(79, -145);
    eyelid.quadraticBezierTo(98, -132, 116, -144);
    eyelid.strokePath();
    eyelid.lineStyle(3, 0x32100c, 1);
    eyelid.beginPath();
    eyelid.moveTo(113, -144);
    eyelid.lineTo(121, -149);
    eyelid.moveTo(113, -141);
    eyelid.lineTo(121, -140);
    eyelid.strokePath();

    const headContainer = scene.add.container(pivot.x, pivot.y, [headImage, eyelid])
      .setDepth(18);

    const baseX = headContainer.x;
    const baseY = headContainer.y;

    // Movimiento claramente visible: pequeño, pero real.
    scene.tweens.add({
      targets: headContainer,
      x: { from: baseX - 2.5, to: baseX + 2.5 },
      y: { from: baseY + 3, to: baseY - 4 },
      angle: { from: -0.75, to: 0.85 },
      scaleX: { from: 0.996, to: 1.006 },
      scaleY: { from: 0.997, to: 1.008 },
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // Pestañeo visible y frecuente.
    const blinkOnce = () => {
      eyelid.setVisible(true);
      scene.time.delayedCall(180, () => {
        eyelid.setVisible(false);
        scene.time.delayedCall(Phaser.Math.Between(1500, 2800), blinkOnce);
      });
    };
    scene.time.delayedCall(700, blinkOnce);

    // Respiración: una variación leve en hombros/pecho, separada del balanceo.
    // No mueve los pies ni el cuerpo completo.
    const breathGlow = scene.add.ellipse(255, 655, 250, 120, 0xffffff, 0)
      .setDepth(17);
    scene.tweens.add({
      targets: breathGlow,
      scaleY: { from: 0.985, to: 1.025 },
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    scene.__womanIdleObjects = {
      headContainer,
      headImage,
      eyelid,
      breathGlow
    };

    return true;
  };

  const timer = window.setInterval(() => {
    if (waitForEntrada()) window.clearInterval(timer);
  }, 100);
})();
