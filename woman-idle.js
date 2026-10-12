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

    if (!scene || !scene.sys || !scene.sys.isActive() || !scene.textures.exists('entrada')) return false;
    if (scene.__womanIdleReady) return true;
    scene.__womanIdleReady = true;

    const source = scene.textures.get('entrada').getSourceImage();
    const sx = source.width / GAME_WIDTH;
    const sy = source.height / GAME_HEIGHT;

    const headRect = { x: 0, y: 270, width: 360, height: 370 };
    const headPolygon = [
      [46,45],[31,100],[38,133],[15,139],[0,130],[0,301],[93,345],
      [111,341],[126,311],[150,291],[184,296],[244,325],[271,325],
      [277,312],[267,297],[301,288],[323,248],[330,208],[318,199],
      [341,118],[300,74],[299,56],[230,55],[227,47],[174,42],
      [131,22],[115,23],[120,37]
    ];

    if (!scene.textures.exists('woman-head-live')) {
      const tex = scene.textures.createCanvas('woman-head-live', headRect.width, headRect.height);
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, headRect.width, headRect.height);
      ctx.imageSmoothingEnabled = true;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(headPolygon[0][0], headPolygon[0][1]);
      for (let i = 1; i < headPolygon.length; i++) ctx.lineTo(headPolygon[i][0], headPolygon[i][1]);
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

    const pivot = { x: 180, y: 590 };

    // Oscurece apenas la cabeza original que queda debajo. Esto evita que al
    // mover la capa superior se vea una segunda cara completa detrás.
    const shadow = scene.add.graphics().setDepth(17);
    shadow.fillStyle(0x12070a, 0.16);
    shadow.beginPath();
    shadow.moveTo(headRect.x + headPolygon[0][0], headRect.y + headPolygon[0][1]);
    for (let i = 1; i < headPolygon.length; i++) {
      shadow.lineTo(headRect.x + headPolygon[i][0], headRect.y + headPolygon[i][1]);
    }
    shadow.closePath();
    shadow.fillPath();

    const headImage = scene.add.image(0, 0, 'woman-head-live')
      .setOrigin(0, 0)
      .setPosition(headRect.x - pivot.x, headRect.y - pivot.y);

    const eyelid = scene.add.graphics().setVisible(false);

    // Coordenada corregida: ahora cae sobre el ojo que está abierto.
    eyelid.fillStyle(0xffad73, 1);
    eyelid.fillEllipse(98, -160, 45, 44);
    eyelid.lineStyle(6, 0x32100c, 1);
    eyelid.beginPath();
    eyelid.moveTo(78, -162);
    eyelid.quadraticBezierTo(98, -148, 118, -161);
    eyelid.strokePath();
    eyelid.lineStyle(3, 0x32100c, 1);
    eyelid.beginPath();
    eyelid.moveTo(115, -161);
    eyelid.lineTo(124, -166);
    eyelid.moveTo(115, -158);
    eyelid.lineTo(124, -157);
    eyelid.strokePath();

    const headContainer = scene.add.container(pivot.x, pivot.y, [headImage, eyelid]).setDepth(18);
    const baseX = headContainer.x;
    const baseY = headContainer.y;

    // Ahora el movimiento debe verse a simple vista: sigue siendo un idle,
    // pero ya no depende de mirar píxeles para detectarlo.
    scene.tweens.add({
      targets: headContainer,
      x: { from: baseX - 5, to: baseX + 5 },
      y: { from: baseY + 6, to: baseY - 7 },
      angle: { from: -1.25, to: 1.35 },
      scaleX: { from: 0.992, to: 1.012 },
      scaleY: { from: 0.994, to: 1.016 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    const blinkOnce = () => {
      eyelid.setVisible(true);
      scene.time.delayedCall(260, () => {
        eyelid.setVisible(false);
        scene.time.delayedCall(Phaser.Math.Between(1200, 2300), blinkOnce);
      });
    };
    scene.time.delayedCall(650, blinkOnce);

    scene.__womanIdleObjects = { headContainer, headImage, eyelid, shadow };
    return true;
  };

  const timer = window.setInterval(() => {
    if (waitForEntrada()) window.clearInterval(timer);
  }, 100);
})();
