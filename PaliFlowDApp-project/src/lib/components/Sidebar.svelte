<script>
  import { currentRoute } from '../router.js'
</script>

<aside class="sidebar">
  <div class="brand">
    <span class="logo" title="PaliFlow">
      <span class="logo-ring"></span>
      <span class="logo-orbiter"></span>
      <svg viewBox="0 0 24 24" class="logo-glyph" aria-hidden="true">
        <defs>
          <linearGradient id="paliflow-logo-grad" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0" stop-color="#c084fc" />
            <stop offset="1" stop-color="#22d3ee" />
          </linearGradient>
        </defs>
        <path class="glyph-stem" d="M7 3v18" />
        <path class="glyph-bowl" d="M7 3h5.4a4.6 4.6 0 0 1 0 9.2H7" />
        <path class="glyph-flow" d="M5.5 20.5c2 0 2-1.6 4-1.6s2 1.6 4 1.6 2-1.6 4-1.6 2 1.6 4 1.6" />
      </svg>
    </span>
    <span class="title">PaliFlow</span>
  </div>

  <nav>
    <a
      href="#/home"
      class="nav-link"
      class:active={$currentRoute === 'home'}
    >
      <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
        <path
          d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5.5v-6h-4.5v6H4a1 1 0 0 1-1-1v-9.5Z"
        />
      </svg>
      <span>Home</span>
    </a>

    <a
      href="#/connect"
      class="nav-link"
      class:active={$currentRoute === 'connect'}
    >
      <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
        <path
          d="M7 11V7a5 5 0 0 1 10 0v4m-9 0h8l1 10H6l1-10Zm2-5v3h2V6h-2Zm3 0v3h2V6h-2Z"
        />
      </svg>
      <span>Connect</span>
    </a>

    <a
      href="#/transfer"
      class="nav-link"
      class:active={$currentRoute === 'transfer'}
    >
      <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
        <path
          d="M4 7h13l-3-3 1.4-1.4L21 8l-5.6 5.4L14 12l3-3H4V7Zm16 10H7l3 3-1.4 1.4L3 16l5.6-5.4L10 12l-3 3h13v2Z"
        />
      </svg>
      <span>Transfer</span>
    </a>

    <a
      href="#/redes"
      class="nav-link"
      class:active={$currentRoute === 'redes'}
    >
      <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="18" r="2.5" />
        <circle cx="19" cy="18" r="2.5" />
        <path
          d="M12 7.5v4M7.2 16.4l-1.4-2.3a4 4 0 0 1 .9-1.9L7 13.5l-1.4-2.3 1-6 1.3 3M16.8 16.4l2.6-5.9-1.3-2.9"
        />
      </svg>
      <span>Redes</span>
    </a>
  </nav>
</aside>

<style>
  .sidebar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 24px;
    box-sizing: border-box;
    background: var(--code-bg);
    border-bottom: 1px solid var(--border);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--code-bg);
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }

  .brand:hover .logo {
    transform: scale(1.08);
  }

  .logo-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 2px;
    background: conic-gradient(
      from 0deg,
      var(--accent),
      #22d3ee,
      #7c3aed,
      var(--accent)
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    animation: ring-spin 4s linear infinite;
  }

  .logo-orbiter {
    position: absolute;
    inset: -3px;
    animation: ring-spin 6s linear infinite reverse;
    pointer-events: none;
  }

  .logo-orbiter::after {
    content: '';
    position: absolute;
    top: -1.5px;
    left: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    translate: -50% -1px;
    background: #22d3ee;
    box-shadow: 0 0 8px #22d3ee;
  }

  .logo-glyph {
    position: relative;
    width: 22px;
    height: 22px;
    fill: none;
    stroke: url(#paliflow-logo-grad);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 4px var(--accent-border));
    z-index: 1;
  }

  .glyph-flow {
    stroke-dasharray: 3 8;
    animation: stream 1.2s linear infinite;
  }

  @keyframes ring-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes stream {
    to {
      stroke-dashoffset: -11;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .logo-ring,
    .logo-orbiter,
    .glyph-flow {
      animation: none;
    }
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-h);
  }

  nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text);
    font-size: 15px;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .nav-link:hover {
    background: var(--accent-bg);
    color: var(--text-h);
  }

  .nav-link.active {
    background: var(--accent-bg);
    color: var(--accent);
    font-weight: 600;
  }

  .icon {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 700px) {
    .sidebar {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    nav {
      margin-left: 0;
    }
  }
</style>