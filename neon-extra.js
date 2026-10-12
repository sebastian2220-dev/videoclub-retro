(() => {
  const waitForEntrada = () => {
    const game = Phaser.GAMES && Phaser.GAMES[0];
    if (!game) return false;

    let scene;
    try {
      scene = game.scene.getScene('Entrada');
    } catch (_) {
      return false;
    }

    if (!scene || !scene.sys || !scene.sys.isActive() || !scene.textures.exists('soft-light')) {
      return false;
    }

    if (scene.__neonExtraReady) return true;
    scene.__neonExtraReady = true;

    const ADD = Phaser.BlendModes.ADD;

    const addGlow = (x, y, width, height, color, alpha, depth = 11, angle = 0) => {
      const light = scene.add.image(x, y, 'soft-light')
        .setDisplaySize(width, height)
        .setTint(color)
        .setAlpha(alpha)
        .setDepth(depth)
        .setAngle(angle)
        .setBlendMode(ADD);

      light.__baseAlpha = alpha;
      return light;
    };

    const addDimmer = (x, y, width, height, restAlpha = 0.012, depth = 12, angle = 0) => {
      return scene.add.image(x, y, 'soft-light')
        .setDisplaySize(width, height)
        .setTint(0x030207)
        .setAlpha(restAlpha)
        .setDepth(depth)
        .setAngle(angle)
        .setBlendMode(Phaser.BlendModes.NORMAL);
    };

    const makeNeon = ({
      name,
      lights,
      dimmer,
      pulseMin,
      pulseMax = 1,
      pulseMs,
      pulseDelay = 0,
      flickerMinMs,
      flickerMaxMs,
      flickerLow = 0.10,
      dimmerRest = 0.012,
      dimmerPulse = 0.08,
      dimmerFlicker = 0.28
    }) => {
      const state = {
        name,
        lights,
        dimmer,
        power: 1,
        flicker: 1
      };

      const refresh = () => {
        const output = state.power * state.flicker;
        state.lights.forEach(light => {
          light.setAlpha(light.__baseAlpha * output);
        });

        if (state.dimmer) {
          const pulseDarkness = (1 - state.power) * dimmerPulse;
          const flickerDarkness = (1 - state.flicker) * dimmerFlicker;
          state.dimmer.setAlpha(
            Phaser.Math.Clamp(dimmerRest + pulseDarkness + flickerDarkness, 0, 0.46)
          );
        }
      };

      // Movimiento permanente: incluso cuando no hay una falla, el tubo “respira”.
      scene.tweens.add({
        targets: state,
        power: { from: pulseMin, to: pulseMax },
        duration: pulseMs,
        delay: pulseDelay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        onUpdate: refresh
      });

      // Pequeños tirones eléctricos frecuentes. La luz y el propio letrero reaccionan juntos.
      const scheduleFlicker = () => {
        scene.time.delayedCall(
          Phaser.Math.Between(flickerMinMs, flickerMaxMs),
          () => {
            const bursts = Phaser.Math.Between(1, 3);
            let current = 0;

            const burst = () => {
              if (current >= bursts) {
                state.flicker = 1;
                refresh();
                scheduleFlicker();
                return;
              }

              state.flicker = Phaser.Math.FloatBetween(flickerLow, 0.42);
              refresh();

              scene.time.delayedCall(Phaser.Math.Between(38, 78), () => {
                state.flicker = 1;
                refresh();
                current += 1;
                scene.time.delayedCall(Phaser.Math.Between(45, 105), burst);
              });
            };

            burst();
          }
        );
      };

      scheduleFlicker();
      refresh();
      return state;
    };

    // VIDEOCLUB: tres zonas independientes. Más visible que antes, pero relativamente estable.
    [
      { x: 680, delay: 0 },
      { x: 960, delay: 180 },
      { x: 1240, delay: 360 }
    ].forEach((seg, index) => {
      const glow = addGlow(seg.x, 205, 455, 225, 0x72dcff, 0.125, 11);
      const spill = addGlow(seg.x, 360, 500, 310, 0xffc96c, 0.042, 5);
      const glass = addGlow(seg.x, 438, 390, 175, 0x55d7ff, 0.030, 5);
      const dimmer = addDimmer(seg.x, 205, 475, 238, 0.010, 12);

      makeNeon({
        name: `VIDEOCLUB-BOOST-${index + 1}`,
        lights: [glow, spill, glass],
        dimmer,
        pulseMin: 0.72,
        pulseMs: 1050 + index * 120,
        pulseDelay: seg.delay,
        flickerMinMs: 2200 + index * 350,
        flickerMaxMs: 4200 + index * 450,
        flickerLow: 0.13,
        dimmerPulse: 0.10,
        dimmerFlicker: 0.32
      });
    });

    // RETRO: debe sentirse bastante más inquieto y brillante.
    [
      { x: 850, delay: 90 },
      { x: 1080, delay: 300 }
    ].forEach((seg, index) => {
      const blue = addGlow(seg.x, 302, 380, 140, 0x37dcff, 0.165, 12);
      const pink = addGlow(seg.x, 305, 345, 118, 0xff48ca, 0.125, 12);
      const spill = addGlow(seg.x, 410, 440, 225, index === 0 ? 0x42d7ff : 0xff4fc2, 0.045, 6);
      const dimmer = addDimmer(seg.x, 302, 392, 150, 0.008, 13);

      makeNeon({
        name: `RETRO-BOOST-${index + 1}`,
        lights: [blue, pink, spill],
        dimmer,
        pulseMin: 0.56,
        pulseMs: 720 + index * 110,
        pulseDelay: seg.delay,
        flickerMinMs: 950 + index * 250,
        flickerMaxMs: 2200 + index * 350,
        flickerLow: 0.07,
        dimmerPulse: 0.13,
        dimmerFlicker: 0.36
      });
    });

    // Cassette derecho: el más “eléctrico” de la fachada.
    {
      const cyan = addGlow(1480, 245, 345, 205, 0x38dcff, 0.145, 12, 1);
      const pink = addGlow(1480, 245, 270, 150, 0xff4dca, 0.105, 12, 1);
      const spill = addGlow(1455, 390, 390, 275, 0x42d6ff, 0.040, 6, 2);
      const dimmer = addDimmer(1480, 245, 350, 205, 0.010, 13, 1);

      makeNeon({
        name: 'CASSETTE-BOOST',
        lights: [cyan, pink, spill],
        dimmer,
        pulseMin: 0.52,
        pulseMs: 620,
        pulseDelay: 180,
        flickerMinMs: 800,
        flickerMaxMs: 1750,
        flickerLow: 0.055,
        dimmerPulse: 0.14,
        dimmerFlicker: 0.38
      });
    }

    // ABIERTO: visible, con reflejo en el vidrio que cae junto con el tubo.
    {
      const pink = addGlow(1085, 540, 290, 138, 0xff47ad, 0.185, 12, -2.5);
      const blue = addGlow(1085, 540, 345, 180, 0x35cfff, 0.115, 11, -2.5);
      const glassBlue = addGlow(1088, 652, 285, 325, 0x49d8ff, 0.070, 6, -1);
      const glassPink = addGlow(1065, 640, 205, 265, 0xff51b9, 0.052, 7, 1);
      const dimmer = addDimmer(1085, 540, 300, 150, 0.012, 13, -2.5);

      makeNeon({
        name: 'ABIERTO-BOOST',
        lights: [pink, blue, glassBlue, glassPink],
        dimmer,
        pulseMin: 0.58,
        pulseMs: 820,
        pulseDelay: 420,
        flickerMinMs: 1000,
        flickerMaxMs: 2350,
        flickerLow: 0.06,
        dimmerPulse: 0.13,
        dimmerFlicker: 0.38
      });
    }

    // Vitrinas: movimiento más discreto, pero ya no quedan muertas por muchos segundos.
    [
      { x: 485, color: 0xff58d3, angle: -1, delay: 250 },
      { x: 1390, color: 0x43d8ff, angle: 1, delay: 650 }
    ].forEach((item, index) => {
      const glow = addGlow(item.x, 485, 430, 215, item.color, 0.050, 8, item.angle);
      const spill = addGlow(item.x, 535, 450, 285, item.color, 0.025, 5, item.angle);

      makeNeon({
        name: `VITRINA-BOOST-${index + 1}`,
        lights: [glow, spill],
        dimmer: null,
        pulseMin: 0.72,
        pulseMs: 1150 + index * 170,
        pulseDelay: item.delay,
        flickerMinMs: 2600 + index * 400,
        flickerMaxMs: 4800 + index * 500,
        flickerLow: 0.18,
        dimmerPulse: 0,
        dimmerFlicker: 0
      });
    });
  };

  const timer = window.setInterval(() => {
    if (waitForEntrada()) {
      window.clearInterval(timer);
    }
  }, 100);
})();
