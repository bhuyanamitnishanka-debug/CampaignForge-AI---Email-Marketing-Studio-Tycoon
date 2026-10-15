import React, { useEffect, useRef, useState } from 'react';
import {
  calculateScore,
  calculateDeliverabilityScore,
  evaluateSpamCollision,
  getWaveParameters,
  checkWinCondition,
  checkGameOverCondition,
} from '../game/rules';

interface InboxTycoonGameProps {
  onBackToStudio: () => void;
}

export const InboxTycoonGame: React.FC<InboxTycoonGameProps> = ({ onBackToStudio }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level UI state (only updated on state transitions / low frequency)
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [outcome, setOutcome] = useState<'victory' | 'defeat'>('victory');
  const [isMuted, setIsMuted] = useState(false);

  // Live HUD snapshot for modal display
  const [hudStats, setHudStats] = useState({
    delivered: 0,
    target: 15,
    deliverability: 100,
    shieldPips: 3,
    score: 0,
    wave: 1,
    combo: 0,
  });

  // Keep references to avoid re-triggering simulation loop
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Audio Context ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play procedural sound effects using Web Audio API
  const playSound = (type: 'deliver' | 'hit' | 'shield' | 'boost' | 'victory' | 'defeat') => {
    if (isMutedRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') {
        ctx?.resume();
      }
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'deliver') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'victory') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'defeat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.35);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      }
    } catch {
      // Audio might be blocked until user gesture
    }
  };

  // Switch game state & sync dataset
  const transitionTo = (nextState: 'title' | 'playing' | 'paused' | 'gameover') => {
    setGameState(nextState);
    document.body.dataset.state = nextState;
  };

  const handleStartGame = () => {
    transitionTo('playing');
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Autostart URL parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      transitionTo('playing');
    } else {
      document.body.dataset.state = 'title';
    }
    return () => {
      delete document.body.dataset.state;
    };
  }, []);

  // Keyboard navigation for Game Shell (Enter/Space to start, Esc/P to pause, M to mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameStateRef.current === 'playing') {
          transitionTo('paused');
        } else if (gameStateRef.current === 'paused') {
          transitionTo('playing');
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (gameStateRef.current === 'title') {
          e.preventDefault();
          transitionTo('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 60FPS SIMULATION LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    // Input tracker
    const keysHeld = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => keysHeld.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keysHeld.delete(e.key.toLowerCase());
    const onBlur = () => keysHeld.clear();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Dynamic canvas resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game Simulation State
    let currentWave = 1;
    let waveParams = getWaveParameters(currentWave);

    const player = {
      x: canvas.width * 0.2,
      y: canvas.height * 0.5,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 380,
      shieldPips: 3,
      maxShield: 3,
      shieldActiveTime: 0,
      invulnerabilityTimer: 5.0, // 5 seconds opening grace period
    };

    let deliveredCount = 0;
    let bouncedCount = 0;
    let spamTrapsHit = 0;
    let spamTrapsAvoided = 0;
    let combo = 0;
    let score = 0;
    let hitstopTimer = 0;
    let cameraTrauma = 0;

    // Pooled entities
    interface TargetInbox {
      x: number;
      y: number;
      radius: number;
      speed: number;
      active: boolean;
      subscribers: number;
    }

    interface Hazard {
      type: 'scanner' | 'swarmer' | 'trap';
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      active: boolean;
      angle: number;
      telegraphTime: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }

    const inboxes: TargetInbox[] = [];
    const hazards: Hazard[] = [];
    const particles: Particle[] = [];

    // Particle Burst Spawner (Zero-GC ring reuse)
    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 220;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.6,
          color,
          size: 2 + Math.random() * 4,
        });
      }
    };

    let spawnTimer = 0;

    // Main 60FPS loop
    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const currentState = gameStateRef.current;

      // Handle Title or Paused rendering
      if (currentState !== 'playing') {
        // Draw background starfield / data stream
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ambient grid lines
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.lineWidth = 1;
        const step = 60;
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        animId = requestAnimationFrame(frame);
        return;
      }

      // Hitstop logic (freeze sim for 30-80ms on heavy hit)
      let simDt = dt;
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
        simDt = 0;
      }

      // 1. INPUT PROCESSING
      let moveX = 0;
      let moveY = 0;
      if (keysHeld.has('arrowup') || keysHeld.has('w')) moveY -= 1;
      if (keysHeld.has('arrowdown') || keysHeld.has('s')) moveY += 1;
      if (keysHeld.has('arrowleft') || keysHeld.has('a')) moveX -= 1;
      if (keysHeld.has('arrowright') || keysHeld.has('d')) moveX += 1;

      // Shield burst action (Space)
      if (keysHeld.has(' ')) {
        if (player.shieldActiveTime <= 0 && player.shieldPips > 0) {
          player.shieldActiveTime = 1.2;
          playSound('shield');
        }
      }
      if (player.shieldActiveTime > 0) {
        player.shieldActiveTime -= simDt;
      }
      if (player.invulnerabilityTimer > 0) {
        player.invulnerabilityTimer -= simDt;
      }

      // Normalize movement vector
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      player.x += moveX * player.speed * simDt;
      player.y += moveY * player.speed * simDt;

      // Clamp player to viewport safe bounds
      player.x = Math.max(player.radius + 20, Math.min(canvas.width - player.radius - 20, player.x));
      player.y = Math.max(player.radius + 60, Math.min(canvas.height - player.radius - 40, player.y));

      // 2. SPAWN LOGIC
      spawnTimer += simDt;
      if (spawnTimer >= waveParams.spawnIntervalMs / 1000) {
        spawnTimer = 0;

        // Spawn Target Inbox Packet
        inboxes.push({
          x: canvas.width + 30,
          y: 100 + Math.random() * (canvas.height - 200),
          radius: 16,
          speed: 180 + Math.random() * 80,
          active: true,
          subscribers: waveParams.subscribersPerPacket,
        });

        // Spawn Hazard (Scanner or Swarmer or Trap)
        const isTrap = Math.random() < waveParams.spamTrapRatio;
        if (isTrap) {
          hazards.push({
            type: 'trap',
            x: canvas.width + 40,
            y: 80 + Math.random() * (canvas.height - 160),
            vx: -waveParams.enemySpeed * 0.7,
            vy: 0,
            radius: 20,
            active: true,
            angle: 0,
            telegraphTime: 0,
          });
        } else {
          const type = Math.random() < 0.5 ? 'scanner' : 'swarmer';
          hazards.push({
            type,
            x: canvas.width + 40,
            y: 80 + Math.random() * (canvas.height - 160),
            vx: -waveParams.enemySpeed,
            vy: type === 'scanner' ? (Math.random() < 0.5 ? 120 : -120) : 0,
            radius: 18,
            active: true,
            angle: 0,
            telegraphTime: 0.6,
          });
        }
      }

      // 3. UPDATE INBOXES
      for (const box of inboxes) {
        if (!box.active) continue;
        box.x -= box.speed * simDt;

        // Player Collision -> Delivery!
        const dx = player.x - box.x;
        const dy = player.y - box.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.radius + box.radius) {
          box.active = false;
          deliveredCount += 1;
          combo += 1;
          score = calculateScore(deliveredCount, combo, spamTrapsAvoided);
          playSound('deliver');
          spawnParticles(box.x, box.y, '#38bdf8', 12);
        } else if (box.x < -40) {
          // Missed delivery -> slight bounce
          box.active = false;
          bouncedCount += 1;
          combo = 0;
        }
      }

      // 4. UPDATE HAZARDS
      for (const h of hazards) {
        if (!h.active) continue;
        h.x += h.vx * simDt;
        h.y += h.vy * simDt;

        // Scanner bounces off top/bottom
        if (h.type === 'scanner') {
          if (h.y < 80 || h.y > canvas.height - 80) {
            h.vy *= -1;
          }
        } else if (h.type === 'swarmer') {
          // Swarmer tracks player vertically
          const dy = player.y - h.y;
          h.y += Math.sign(dy) * 90 * simDt;
        }

        // Check collision with player
        const dx = player.x - h.x;
        const dy = player.y - h.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.radius + h.radius) {
          if (player.invulnerabilityTimer > 0) {
            // Opening grace period: pass through safely
            continue;
          }
          h.active = false;
          const isShielded = player.shieldActiveTime > 0;
          const collision = evaluateSpamCollision(isShielded ? 3 : player.shieldPips, 1);

          if (isShielded) {
            spawnParticles(h.x, h.y, '#a855f7', 16);
            spamTrapsAvoided += 1;
            score += 200;
          } else {
            player.shieldPips = collision.remainingShield;
            spamTrapsHit += 1;
            bouncedCount += collision.bounceAdded;
            combo = 0;
            hitstopTimer = 0.06;
            cameraTrauma = 0.8;
            playSound('hit');
            spawnParticles(player.x, player.y, '#f43f5e', 24);
          }
        } else if (h.x < -50) {
          h.active = false;
          spamTrapsAvoided += 1;
        }
      }

      // 5. UPDATE PARTICLES
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Calculate live reputation / deliverability
      const deliverabilityPercent = calculateDeliverabilityScore(
        deliveredCount,
        bouncedCount,
        spamTrapsHit
      );

      // Check wave win or game over
      if (checkGameOverCondition(deliverabilityPercent, player.shieldPips)) {
        setOutcome('defeat');
        setHudStats({
          delivered: deliveredCount,
          target: waveParams.targetDeliveries,
          deliverability: deliverabilityPercent,
          shieldPips: player.shieldPips,
          score,
          wave: currentWave,
          combo,
        });
        playSound('defeat');
        transitionTo('gameover');
      } else if (checkWinCondition(deliveredCount, waveParams.targetDeliveries)) {
        setOutcome('victory');
        setHudStats({
          delivered: deliveredCount,
          target: waveParams.targetDeliveries,
          deliverability: deliverabilityPercent,
          shieldPips: player.shieldPips,
          score,
          wave: currentWave,
          combo,
        });
        playSound('victory');
        transitionTo('gameover');
      }

      // 6. RENDER PASS WITH CAMERA TRAUMA SHAKE
      ctx.save();

      if (cameraTrauma > 0) {
        cameraTrauma = Math.max(0, cameraTrauma - dt * 2.2);
        const shake = cameraTrauma * cameraTrauma * 16;
        const ox = (Math.random() - 0.5) * shake;
        const oy = (Math.random() - 0.5) * shake;
        ctx.translate(ox, oy);
      }

      // Deep space backdrop
      ctx.fillStyle = '#080b12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ISP Router Pipeline track lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.lineWidth = 1.5;
      const laneCount = 6;
      for (let i = 1; i < laneCount; i++) {
        const ly = (canvas.height / laneCount) * i;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(canvas.width, ly);
        ctx.stroke();
      }

      // Draw Inboxes (Blue luminous packets)
      for (const box of inboxes) {
        if (!box.active) continue;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(box.x, box.y, box.radius, 0, Math.PI * 2);
        ctx.fill();

        // Envelope icon inside packet
        ctx.strokeStyle = '#082f49';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x - 7, box.y - 5, 14, 10);
      }

      // Draw Hazards
      for (const h of hazards) {
        if (!h.active) continue;
        if (h.type === 'scanner') {
          // Scanner beam cone telegraph
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(h.x - 140, h.y - 45);
          ctx.lineTo(h.x - 140, h.y + 45);
          ctx.closePath();
          ctx.fill();

          // Scanner Core
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'swarmer') {
          // Swarmer (Purple Churn Phantom)
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bounce Trap Mine
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Particles
      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Draw Player Ship (The Deliverability Jet)
      ctx.save();
      ctx.translate(player.x, player.y);

      // Shield Aura
      if (player.shieldActiveTime > 0) {
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Jet Body
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(player.radius + 6, 0);
      ctx.lineTo(-player.radius, -player.radius * 0.85);
      ctx.lineTo(-player.radius * 0.4, 0);
      ctx.lineTo(-player.radius, player.radius * 0.85);
      ctx.closePath();
      ctx.fill();

      // Wing accents
      ctx.fillStyle = '#a5b4fc';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore();

      // Throttled HUD update for React readouts
      setHudStats({
        delivered: deliveredCount,
        target: waveParams.targetDeliveries,
        deliverability: deliverabilityPercent,
        shieldPips: player.shieldPips,
        score,
        wave: currentWave,
        combo,
      });

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60FPS Isolated Simulation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full z-0" />

      {/* WORLD-MATCHED PERIMETER HUD OVERLAY (>= 85% Unobstructed, pointer-events: none) */}
      <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">
        
        {/* Top Perimeter HUD Cluster */}
        <div className="flex items-center justify-between">
          
          {/* Left Cluster: Reputation & Wave */}
          <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto shadow-lg">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Deliverability
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                {Math.round(hudStats.deliverability)}%
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Wave
              </span>
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">
                {hudStats.wave}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Delivered
              </span>
              <span className="text-xl font-extrabold text-sky-400 font-mono tabular-nums">
                {hudStats.delivered} / {hudStats.target}
              </span>
            </div>
          </div>

          {/* Right Cluster: Shield Pips & Utility Buttons */}
          <div className="flex items-center space-x-3 pointer-events-auto">
            {/* Shield Vitality Pips (3 States: Full, Cracked, Empty) */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Shield:</span>
              {[1, 2, 3].map((pip) => (
                <svg
                  key={pip}
                  viewBox="0 0 24 24"
                  className={`w-5 h-5 ${
                    hudStats.shieldPips >= pip
                      ? 'text-indigo-400 fill-indigo-500'
                      : hudStats.shieldPips === pip - 1
                      ? 'text-amber-500 fill-transparent stroke-2'
                      : 'text-slate-700 fill-transparent stroke-2'
                  }`}
                >
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                </svg>
              ))}
            </div>

            {/* Mute Button [M] */}
            <button
              onClick={handleToggleMute}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 p-2.5 rounded-xl text-xs font-bold transition-all"
              title="Mute procedural audio [M]"
              aria-label="Toggle mute"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Pause Button [Esc/P] */}
            <button
              onClick={() => transitionTo(gameState === 'paused' ? 'playing' : 'paused')}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              title="Pause [Esc / P]"
              aria-label="Pause game"
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>

            {/* Back to Campaign Studio */}
            <button
              onClick={onBackToStudio}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Exit Studio
            </button>
          </div>

        </div>

        {/* Bottom Perimeter HUD Cluster */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto">
            <span>Score: </span>
            <span className="text-white font-bold tabular-nums text-sm">{hudStats.score}</span>
            {hudStats.combo > 1 && (
              <span className="ml-3 text-amber-400 font-bold">
                {hudStats.combo}x Combo!
              </span>
            )}
          </div>

          <div className="hidden sm:block text-[11px] text-slate-500 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
            WASD / Arrows Move &bull; Space Shield Burst &bull; Esc Pause &bull; M Mute
          </div>
        </div>

      </div>

      {/* GAME SHELL: TITLE SCREEN */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm pointer-events-auto">
          <div className="max-w-md w-full text-center space-y-6">
            
            {/* Inline Bespoke SVG Title Lockup */}
            <div className="flex justify-center">
              <svg viewBox="0 0 240 80" className="w-56 h-auto drop-shadow-2xl">
                <defs>
                  <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <polygon points="20,15 120,5 220,15 120,70" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="2" />
                <path d="M 40 30 L 120 60 L 200 30" fill="none" stroke="#a5b4fc" strokeWidth="3" />
                <text x="120" y="32" fill="url(#titleGrad)" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="3" fontFamily="system-ui, sans-serif">
                  INBOX HERO
                </text>
                <text x="120" y="50" fill="#cbd5e1" fontSize="10" fontWeight="700" textAnchor="middle" letterSpacing="4" fontFamily="system-ui, sans-serif">
                  DELIVERABILITY TYCOON
                </text>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Deliver The Broadcast
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Pilot the Deliverability Packet through the ISP router pipeline. Collect clean inboxes, activate SPF/DKIM shields, and dodge aggressive spam filter sweeps.
              </p>
            </div>

            {/* Primary Start CTA with data-start="true" */}
            <div className="pt-2">
              <button
                type="button"
                data-start="true"
                onClick={handleStartGame}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch Campaign Run &rarr;
              </button>
            </div>

            {/* Flat Single Control-Hint Line */}
            <p className="text-[11px] text-slate-500 font-mono tracking-wide">
              WASD Move &bull; Space Shield &bull; Esc Pause &bull; Enter to Start
            </p>

          </div>
        </div>
      )}

      {/* GAME SHELL: PAUSED MODAL */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Campaign Paused</h3>
            <p className="text-xs text-slate-400">The router simulation is currently on hold.</p>

            <div className="grid grid-cols-2 gap-2 text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Deliveries:</span>
                <span className="text-sky-400 font-bold font-mono">{hudStats.delivered}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Reputation:</span>
                <span className="text-emerald-400 font-bold font-mono">{Math.round(hudStats.deliverability)}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => transitionTo('playing')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Resume Run
              </button>
              <button
                type="button"
                onClick={() => transitionTo('title')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Exit to Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME SHELL: OUTCOME MODALS (VICTORY / GAME OVER) */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm pointer-events-auto">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
            
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-2xl bg-indigo-600/20 border border-indigo-500/40">
              {outcome === 'victory' ? '🏆' : '⚠️'}
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                {outcome === 'victory' ? 'Wave Cleared!' : 'Campaign Blacklisted'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {outcome === 'victory'
                  ? 'All target subscriber inboxes delivered with exceptional reputation.'
                  : 'Deliverability dropped below minimum ISP threshold.'}
              </p>
            </div>

            {/* Run Stats */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Delivered</span>
                <span className="text-lg font-bold text-sky-400 tabular-nums">{hudStats.delivered}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Reputation</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">{Math.round(hudStats.deliverability)}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Final Score</span>
                <span className="text-lg font-bold text-white tabular-nums">{hudStats.score}</span>
              </div>
            </div>

            {/* Play Again CTA with data-start="true" */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                data-start="true"
                onClick={handleStartGame}
                className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                {outcome === 'victory' ? 'Next Wave Run &rarr;' : 'Retry Campaign &rarr;'}
              </button>
              <button
                type="button"
                onClick={onBackToStudio}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back to Campaign Studio
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
