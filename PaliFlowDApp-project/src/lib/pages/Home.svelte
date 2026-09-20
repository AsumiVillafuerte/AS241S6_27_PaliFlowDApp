<script>
  import { onMount } from 'svelte'
  import developerImg from '../../assets/💓.jpg'

  const STATS = [
    { max: 100, suffix: '%', label: 'Descentralizado' },
    { max: 8, suffix: '', label: 'Redes soportadas' },
    { max: 24, suffix: '/7', label: 'Disponibilidad' },
  ]

  const NETWORKS_STRIP = [
    'Rollux',
    'Syscoin NEVM',
    'Ethereum Mainnet',
    'Polygon',
    'Syscoin Testnet',
    'zkTanenbaum',
    'Sepolia',
    'Hoodi',
  ]

  let counts = $state([0, 0, 0])
  let counted = $state(false)

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  function animateCounts() {
    if (counted) return
    counted = true
    const duration = 1500
    const start = performance.now()
    function frame(now) {
      const p = Math.min((now - start) / duration, 1)
      const eased = easeOutCubic(p)
      STATS.forEach((s, i) => {
        counts[i] = Math.round(s.max * eased)
      })
      if (p < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  onMount(() => {
    const root = document.querySelector('.page')
    const targets = root ? [...root.querySelectorAll('.reveal')] : []

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    targets.forEach((t) => io.observe(t))

    const hero = root?.querySelector('.hero')
    if (hero) {
      const heroIo = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animateCounts()
              heroIo.disconnect()
            }
          }
        },
        { threshold: 0.3 },
      )
      heroIo.observe(hero)
    }
  })
</script>

<section class="page">
  <div class="hero">
    <div class="orb orb-a"></div>
    <div class="orb orb-b"></div>
    <div class="orb orb-c"></div>
    <div class="grid-lines"></div>

    <div class="hero-inner">
      <span class="hero-badge reveal">
        <span class="pulse"></span>
        Web3 · DApp descentralizada
      </span>

      <h1 class="reveal" style:--d="100ms">
        Pali<span class="accent">Flow</span>
      </h1>
      <p class="lead reveal" style:--d="200ms">
        La aplicación descentralizada que lleva tus criptomonedas al siguiente
        nivel. Conecta tu wallet, consulta tus saldos y transfiere tokens entre
        redes con una experiencia moderna, rápida y segura.
      </p>

      <div class="cta reveal" style:--d="300ms">
        <a href="#/connect" class="cta-btn cta-primary">
          Conectar wallet
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </a>
        <a href="#/redes" class="cta-btn cta-ghost">Explorar redes</a>
      </div>

      <div class="stats reveal" style:--d="400ms">
        {#each STATS as stat, i}
          <div class="stat">
            <span class="stat-value">{counts[i]}{stat.suffix}</span>
            <span class="stat-label">{stat.label}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      <div class="marquee-inner">
        {#each [...NETWORKS_STRIP, ...NETWORKS_STRIP] as name, i}
          <span>
            <i class="dot"></i>
            {name}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head reveal">
      <span class="section-tag">Propósito</span>
      <h2>Objetivos</h2>
    </div>
    <div class="grid">
      {#each [
        { icon: 'lock', title: 'Conexión segura', desc: 'Conecta billeteras de forma rápida, sin comprometer tu seguridad.' },
        { icon: 'chart', title: 'Resumen claro', desc: 'Visualiza el balance y los activos de tu cartera en un solo lugar.' },
        { icon: 'send', title: 'Transferencias', desc: 'Envía tokens entre redes de manera confiable y sin fricción.' },
        { icon: 'net', title: 'Multi-red', desc: 'Administra distintas cadenas y redes desde una sola interfaz.' },
      ] as item, i}
        <article class="card reveal" style:--i={i}>
          <div class="card-icon">
            {#if item.icon === 'lock'}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 11V7a5 5 0 0 1 10 0v4m-9 0h8l1 10H6l1-10Z" />
              </svg>
            {:else if item.icon === 'chart'}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 3 3 5-6" />
              </svg>
            {:else if item.icon === 'send'}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h13l-3-3 1.4-1.4L21 8l-5.6 5.4L14 12l3-3H4V7Z" />
                <path d="M20 17H7l3 3-1.4 1.4L3 16l5.6-5.4L10 12l-3 3h13v2Z" />
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <path d="M12 7v8a4 4 0 0 0 4 4h3M12 15a4 4 0 0 0-4 4H5" />
              </svg>
            {/if}
          </div>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </article>
      {/each}
    </div>
  </div>

  <div class="section">
    <div class="section-head reveal">
      <span class="section-tag">Ventajas</span>
      <h2>Beneficios</h2>
    </div>
    <div class="benefits">
      {#each [
        'Interfaz moderna e intuitiva construida con Svelte.',
        'Navegación ultrarrápida con enrutamiento por hash.',
        'Múltiples redes soportadas desde un solo lugar.',
        'Código limpio, mantenible y fácil de ampliar.',
        'Experiencia optimizada para nuevos usuarios en web3.',
        'Seguridad por diseño, tus claves nunca salen de tu wallet.',
      ] as benefit, i}
        <div class="benefit reveal" style:--i={i}>
          <span class="check">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
          {benefit}
        </div>
      {/each}
    </div>
  </div>

  <div class="section">
    <div class="section-head reveal">
      <span class="section-tag">Funciones</span>
      <h2>Características</h2>
    </div>
    <div class="features">
      {#each [
        { name: 'Connect', desc: 'Conecta tu billetera con un flujo guiado paso a paso.' },
        { name: 'Transfer', desc: 'Envía y recibe tokens de forma segura entre cuentas.' },
        { name: 'Redes', desc: 'Explora y gestiona cada red disponible en la DApp.' },
      ] as feature, i}
        <article class="feature reveal" style:--i={i}>
          <span class="feature-num">0{i + 1}</span>
          <span class="feature-line"></span>
          <h3>{feature.name}</h3>
          <p>{feature.desc}</p>
          <a href="#/{feature.name.toLowerCase()}" class="feature-link">
            Abrir
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
        </article>
      {/each}
    </div>
  </div>

  <div class="section">
    <div class="section-head reveal">
      <span class="section-tag">Equipo</span>
      <h2>Desarrollador</h2>
    </div>
    <div class="developer reveal">
      <div class="dev-avatar">
        <img src={developerImg} alt="Foto del desarrollador" />
        <span class="dev-online"></span>
      </div>
      <div class="dev-info">
        <h3>PaliFlow Team</h3>
        <p class="dev-role">Desarrollador &amp; Diseñador de la DApp</p>
        <div class="dev-tags">
          <span class="tag">Svelte</span>
          <span class="tag">JavaScript</span>
          <span class="tag">Web3</span>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .page {
    width: 100%;
    box-sizing: border-box;
    color: var(--text);
  }

  .reveal {
    opacity: 0;
    transform: translateY(26px);
    transition:
      opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(var(--d, 0ms) + var(--i, 0) * 90ms);
  }

  :global(.reveal.visible) {
    opacity: 1;
    transform: none;
  }

  .hero {
    position: relative;
    overflow: hidden;
    padding: clamp(56px, 9vw, 120px) clamp(24px, 6vw, 72px) clamp(64px, 9vw, 110px);
    text-align: center;
    background:
      radial-gradient(80% 55% at 50% -10%, var(--accent-bg), transparent 70%),
      var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 900px;
    margin: 0 auto;
  }

  .grid-lines {
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.5;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 56px 56px;
    -webkit-mask-image: radial-gradient(70% 60% at 50% 0%, #000 20%, transparent 80%);
    mask-image: radial-gradient(70% 60% at 50% 0%, #000 20%, transparent 80%);
    animation: gridDrift 16s linear infinite;
  }

  @keyframes gridDrift {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 0 56px;
    }
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    z-index: 0;
    opacity: 0.9;
  }

  .orb-a {
    width: 320px;
    aspect-ratio: 1;
    top: -80px;
    left: -80px;
    background: radial-gradient(closest-side, var(--accent-bg), transparent);
    animation: floatA 14s ease-in-out infinite;
  }

  .orb-b {
    width: 280px;
    aspect-ratio: 1;
    top: 10%;
    right: -60px;
    background: radial-gradient(closest-side, rgba(124, 58, 237, 0.18), transparent);
    animation: floatB 12s ease-in-out infinite;
  }

  .orb-c {
    width: 200px;
    aspect-ratio: 1;
    bottom: -50px;
    left: 30%;
    background: radial-gradient(closest-side, var(--accent-bg), transparent);
    animation: floatA 18s ease-in-out infinite reverse;
  }

  @keyframes floatA {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(30px, 30px, 0) scale(1.08);
    }
  }

  @keyframes floatB {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(-24px, -20px, 0) scale(0.94);
    }
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    backdrop-filter: blur(6px);
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 0 var(--accent);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--accent-border);
    }
    70% {
      box-shadow: 0 0 0 9px transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  .hero h1 {
    margin: 22px 0 10px;
    font-size: clamp(48px, 9vw, 96px);
    line-height: 1.05;
    letter-spacing: -2.5px;
    color: var(--text-h);
    animation: glow 5s ease-in-out infinite;
  }

  .hero h1 .accent {
    color: var(--accent);
  }

  @keyframes glow {
    0%,
    100% {
      text-shadow: 0 0 18px var(--accent-border);
    }
    50% {
      text-shadow: 0 0 46px var(--accent);
    }
  }

  .lead {
    max-width: 680px;
    margin: 0 auto;
    font-size: 19px;
    line-height: 1.65;
  }

  .cta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 34px;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
  }

  .cta-btn svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s;
  }

  .cta-btn:hover svg {
    transform: translateX(4px);
  }

  .cta-primary {
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
    box-shadow: 0 10px 26px -10px var(--accent);
  }

  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px -12px var(--accent);
  }

  .cta-ghost {
    color: var(--text-h);
    border: 1px solid var(--border);
    background: var(--social-bg);
  }

  .cta-ghost:hover {
    transform: translateY(-2px);
    border-color: var(--accent-border);
    color: var(--accent);
  }

  .stats {
    display: flex;
    justify-content: center;
    gap: clamp(28px, 6vw, 72px);
    flex-wrap: wrap;
    margin-top: 52px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-value {
    font-size: clamp(30px, 4vw, 38px);
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-h);
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text);
  }

  .marquee {
    overflow: hidden;
    border-bottom: 1px solid var(--border);
    background: var(--social-bg);
    padding: 14px 0;
  }

  .marquee-track {
    width: max-content;
  }

  .marquee-inner {
    display: flex;
    width: max-content;
    animation: marquee 26s linear infinite;
  }

  .marquee-inner span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 40px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--text);
    white-space: nowrap;
  }

  .marquee-inner .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }

  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  .section {
    padding: clamp(40px, 6vw, 72px) clamp(24px, 6vw, 72px);
  }

  .section-head {
    margin-bottom: 28px;
  }

  .section-tag {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
  }

  .section-head h2 {
    margin: 10px 0 0;
    font-size: clamp(28px, 4vw, 38px);
    letter-spacing: -0.5px;
    color: var(--text-h);
    background: linear-gradient(90deg, var(--text-h), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }

  .card {
    position: relative;
    overflow: hidden;
    padding: 26px 24px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    transition:
      transform 0.25s,
      box-shadow 0.25s,
      border-color 0.25s;
  }

  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.06) 50%, transparent 70%);
    transform: translateX(-120%);
    transition: transform 0.7s;
    pointer-events: none;
  }

  .card:hover::after {
    transform: translateX(120%);
  }

  .card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow);
    border-color: var(--accent-border);
  }

  .card-icon {
    display: inline-flex;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    margin-bottom: 18px;
    position: relative;
  }

  .card-icon::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 16px;
    border: 1px dashed var(--accent-border);
    opacity: 0;
    transition: opacity 0.3s, transform 0.5s;
  }

  .card:hover .card-icon::before {
    opacity: 1;
    transform: rotate(10deg);
  }

  .card-icon svg {
    width: 23px;
    height: 23px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .card h3,
  .feature h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: var(--text-h);
  }

  .card p,
  .feature p {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
  }

  .benefits {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
  }

  .benefit {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 18px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    font-size: 15px;
    transition:
      transform 0.25s,
      border-color 0.25s,
      background 0.25s;
  }

  .benefit:hover {
    transform: translateX(6px);
    border-color: var(--accent-border);
    background: var(--accent-bg);
  }

  .check {
    display: inline-flex;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
    box-shadow: 0 4px 14px -4px var(--accent);
  }

  .check svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }

  .feature {
    position: relative;
    overflow: hidden;
    padding: 30px 24px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    transition:
      transform 0.25s,
      box-shadow 0.25s,
      border-color 0.25s,
      background 0.25s;
  }

  .feature:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow);
    border-color: var(--accent-border);
    background:
      radial-gradient(120% 90% at 15% 0%, var(--accent-bg), transparent 60%),
      var(--social-bg);
  }

  .feature-num {
    position: absolute;
    top: 6px;
    right: 16px;
    font-size: 52px;
    font-weight: 800;
    line-height: 1;
    color: var(--accent);
    opacity: 0.12;
  }

  .feature-line {
    display: block;
    width: 34px;
    height: 3px;
    margin-bottom: 16px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), #7c3aed);
    transition: width 0.3s;
  }

  .feature:hover .feature-line {
    width: 52px;
  }

  .feature-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    color: var(--accent);
  }

  .feature-link svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s;
  }

  .feature-link:hover svg {
    transform: translateX(4px);
  }

  .developer {
    position: relative;
    display: flex;
    align-items: center;
    gap: 28px;
    padding: 32px;
    border-radius: 20px;
    background:
      linear-gradient(120deg, var(--accent-bg), transparent 60%),
      var(--social-bg);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .developer::after {
    content: '';
    position: absolute;
    inset: auto -10% -80% auto;
    width: 50%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(closest-side, var(--accent-bg), transparent);
    pointer-events: none;
  }

  .dev-avatar {
    position: relative;
    flex-shrink: 0;
    padding: 4px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, var(--accent), #7c3aed, var(--accent));
    animation: spin 6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .dev-avatar img {
    display: block;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--bg);
  }

  .dev-online {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #22c55e;
    border: 4px solid var(--bg);
    animation: pulse 2.2s infinite;
  }

  .dev-info {
    position: relative;
    z-index: 1;
  }

  .dev-info h3 {
    margin: 0 0 4px;
    font-size: 24px;
    color: var(--text-h);
  }

  .dev-role {
    margin: 0 0 14px;
    color: var(--accent);
    font-weight: 600;
  }

  .dev-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tag {
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-h);
    background: var(--bg);
    border: 1px solid var(--border);
    transition: border-color 0.2s, color 0.2s;
  }

  .tag:hover {
    border-color: var(--accent-border);
    color: var(--accent);
  }

  @media (max-width: 700px) {
    .developer {
      flex-direction: column;
      text-align: center;
    }

    .dev-tags {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orb,
    .grid-lines,
    .marquee-inner,
    .dev-avatar,
    .dev-online,
    .hero h1 {
      animation: none;
    }

    .reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>