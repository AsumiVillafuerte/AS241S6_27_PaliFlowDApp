<script>
  import { onMount } from 'svelte'
  import { account, connected, initPali } from '../pali.js'

  const NETWORKS = [
    { name: 'Rollux', type: 'L2', chainId: 570, symbol: 'SYS', rpc: 'https://rpc.rollux.com' },
    { name: 'Syscoin NEVM', type: 'Mainnet', chainId: 57, symbol: 'SYS', rpc: 'https://rpc.syscoin.org' },
    { name: 'Ethereum Mainnet', type: 'Mainnet', chainId: 1, symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
    { name: 'Polygon Mainnet', type: 'Mainnet', chainId: 137, symbol: 'POL', rpc: 'https://polygon-rpc.com' },
    { name: 'Syscoin NEVM Testnet', type: 'Testnet', chainId: 5700, symbol: 'TSYS', rpc: 'https://rpc.tanenbaum.io' },
    { name: 'zkTanenbaum Testnet', type: 'Testnet', chainId: 57057, symbol: 'TSYS', rpc: 'http://rpc1.zktsys.com' },
    { name: 'Ethereum Hoodi', type: 'Testnet', chainId: 560048, symbol: 'ETH', rpc: 'https://ethereum-hoodi-rpc.publicnode.com' },
    { name: 'Ethereum Sepolia', type: 'Testnet', chainId: 11155111, symbol: 'ETH', rpc: 'https://ethereum-sepolia-rpc.publicnode.com' },
  ]

  let address = $state('')
  let selectedChain = $state('all')
  let querying = $state(false)
  let single = $state(null)
  let mass = $state([])
  let errorMsg = $state('')

  const allNetworks = $derived(selectedChain === 'all')
  const selectedNetwork = $derived(
    NETWORKS.find((n) => n.chainId === selectedChain),
  )
  const sessionActive = $derived($connected && $account)
  const sessionAddress = $derived(
    $account ? `${$account.slice(0, 6)}…${$account.slice(-4)}` : '',
  )

  onMount(() => {
    initPali()
  })

  function isValidAddress(addr) {
    return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr)
  }

  function chainIdHex(id) {
    return `0x${id.toString(16)}`
  }

  function formatBalance(hexWei) {
    if (!hexWei) return '0'
    const wei = BigInt(hexWei)
    const divisor = 10n ** 18n
    const whole = wei / divisor
    const frac = (wei % divisor).toString().padStart(18, '0').slice(0, 6)
    const trimmed = frac.replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole.toString()
  }

  async function rpcCall(network, method, params) {
    const res = await fetch(network.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message || 'Error RPC')
    return data.result
  }

  async function queryNetwork(network, addr) {
    const [chain, wei] = await Promise.all([
      rpcCall(network, 'eth_chainId', []),
      rpcCall(network, 'eth_getBalance', [addr, 'latest']),
    ])
    const expected = String(network.chainId).toLowerCase()
    const actual = String(parseInt(chain, 16)).toLowerCase()
    return {
      network,
      balance: formatBalance(wei),
      symbol: network.symbol,
      verified: expected === actual,
      actualChainId: actual,
    }
  }

  async function runSingle() {
    errorMsg = ''
    single = null
    if (!isValidAddress(address)) {
      errorMsg = 'Dirección inválida (formato 0x + 40 caracteres hexadecimales).'
      return
    }
    if (allNetworks) {
      return runMass()
    }
    querying = true
    try {
      single = await queryNetwork(selectedNetwork, address)
    } catch (err) {
      errorMsg = `No se pudo consultar ${selectedNetwork.name}: ${err.message}`
    } finally {
      querying = false
    }
  }

  async function runMass() {
    errorMsg = ''
    mass = []
    if (!isValidAddress(address)) {
      errorMsg = 'Dirección inválida (formato 0x + 40 caracteres hexadecimales).'
      return
    }
    querying = true
    mass = NETWORKS.map((network) => ({
      network,
      status: 'pendiente',
      balance: null,
      symbol: network.symbol,
      verified: null,
      actualChainId: null,
    }))

    await Promise.all(
      mass.map(async (row, i) => {
        try {
          const result = await queryNetwork(NETWORKS[i], address)
          mass[i] = {
            status: 'ok',
            balance: result.balance,
            symbol: result.verified ? result.symbol : `? ${result.symbol}`,
            verified: result.verified,
            actualChainId: result.actualChainId,
          }
        } catch (err) {
          mass[i] = {
            status: 'error',
            balance: null,
            symbol: row.symbol,
            verified: null,
            actualChainId: null,
            error: err.message,
          }
        }
      }),
    )
    querying = false
  }
</script>

<section class="page">
  <div class="head">
    <span class="tag">Consulta de saldos</span>
    <h1>Redes</h1>
    <p>
      Consulta el saldo de una dirección en una red o en todas las 8 redes
      (RedChain ID), con o sin inicio de sesión.
    </p>
  </div>

  <div class="session-card" class:active={sessionActive}>
    {#if sessionActive}
      <span class="dot online"></span>
      <span>
        <strong>Sesión iniciada</strong> — Cuenta conectada:
        <span class="mono">{sessionAddress}</span>
      </span>
      <button
        type="button"
        class="btn btn-small"
        onclick={() => (address = $account)}
      >
        Usar mi cuenta
      </button>
    {:else}
      <span class="dot"></span>
      <span>
        <strong>Sin inicio de sesión</strong> — Puedes consultar el saldo de
        cualquier dirección con o sin wallet conectada.
      </span>
    {/if}
  </div>

  <div class="layout">
    <div class="query-card">
      <div class="field">
        <label for="addr">Dirección</label>
        <input
          id="addr"
          type="text"
          placeholder="0x..."
          spellcheck="false"
          autocomplete="off"
          bind:value={address}
        />
      </div>

      <div class="field">
        <label for="net">Red</label>
        <select id="net" bind:value={selectedChain}>
          <option value="all">Todas las redes</option>
          {#each NETWORKS as network}
            <option value={network.chainId}>
              {network.name} · {network.chainId} ({chainIdHex(network.chainId)})
            </option>
          {/each}
        </select>
      </div>

      <button type="button" class="btn btn-primary" onclick={runSingle} disabled={querying}>
        {querying
          ? 'Consultando…'
          : allNetworks
            ? 'Consultar saldo en todas las redes'
            : `Consultar saldo en ${selectedNetwork.name}`}
      </button>

      {#if errorMsg}
        <div class="error-msg">{errorMsg}</div>
      {/if}
    </div>

    <div class="result-card">
      {#if allNetworks}
        {#if mass.length > 0}
          <table class="mass-table">
            <thead>
              <tr>
                <th>Red</th>
                <th>RedChain ID</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {#each mass as row, i}
                <tr>
                  <td>
                    <span class="net-name">{NETWORKS[i].name}</span>
                    {#if row.verified !== null}
                      <span
                        class="net-verify"
                        class:ok={row.verified}
                        class:bad={!row.verified}
                      >
                        {row.verified ? '✓' : '✗'}
                      </span>
                    {/if}
                  </td>
                  <td class="mono">
                    {NETWORKS[i].chainId}
                    <small>0x{NETWORKS[i].chainId.toString(16)}</small>
                  </td>
                  <td class="balance-cell">
                    {#if row.status === 'pendiente'}
                      <span class="pending">Consultando…</span>
                    {:else if row.status === 'ok'}
                      {row.balance} {row.symbol}
                    {:else}
                      <span class="fail">Error</span>
                    {/if}
                  </td>
                  <td class="status-cell">
                    {#if row.status === 'ok'}
                      <span class="pill ok">OK</span>
                    {:else if row.status === 'error'}
                      <span class="pill fail" title={row.error}>Error</span>
                    {:else}
                      <span class="pill pending">…</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="total-line">
            Redes consultadas: {mass.filter((r) => r.status === 'ok').length}/{NETWORKS.length}
          </p>
        {:else}
          <div class="placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
            <p>Consulta el saldo de la dirección en las 8 redes a la vez.</p>
          </div>
        {/if}
      {:else}
        {#if single}
          <div class="single-result">
            <h3>{single.network.name}</h3>
            <span class="chip">
              RedChain ID: {single.network.chainId} ({chainIdHex(single.network.chainId)})
            </span>
            {#if single.verified}
              <span class="chip ok">Cadena verificada por RPC</span>
            {:else}
              <span class="chip warn">
                RPC responde chainId {single.actualChainId} (esperada {single.network.chainId})
              </span>
            {/if}
            <div class="balance-big">
              {single.balance} <small>{single.symbol}</small>
            </div>
            <p class="address-line" title={address}>{address}</p>
          </div>
        {:else}
          <div class="placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v18h18" />
              <path d="m7 14 4-4 3 3 5-6" />
            </svg>
            <p>Selecciona una red y consulta el saldo de la dirección.</p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</section>

<style>
  .page {
    padding: clamp(32px, 5vw, 56px) clamp(24px, 6vw, 72px);
    width: 100%;
    box-sizing: border-box;
    color: var(--text);
  }

  .head {
    margin-bottom: 24px;
  }

  .tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--accent);
  }

  .head h1 {
    margin: 8px 0;
    font-size: clamp(36px, 5vw, 56px);
    color: var(--text-h);
  }

  .head p {
    max-width: 640px;
  }

  .session-card {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 14px 18px;
    margin-bottom: 24px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    font-size: 14px;
  }

  .session-card.active {
    border-color: rgba(34, 197, 94, 0.35);
  }

  .dot {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--border);
  }

  .dot.online {
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
  }

  .mono {
    font-family: var(--mono);
  }

  .btn {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    border: none;
    cursor: pointer;
    transition:
      transform 0.15s,
      box-shadow 0.15s,
      background 0.15s;
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-small {
    margin-left: auto;
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 999px;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
  }

  .btn-primary {
    width: 100%;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
    box-shadow: 0 8px 24px -8px var(--accent);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 24px;
    align-items: start;
  }

  .query-card,
  .result-card {
    padding: 28px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    box-shadow: var(--shadow);
  }

  .field {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .field input,
  .field select {
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-h);
    font-size: 15px;
    font-family: var(--mono);
    box-sizing: border-box;
    width: 100%;
  }

  .field input:focus,
  .field select:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
    border-color: var(--accent-border);
  }

  .error-msg {
    margin-top: 18px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .single-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    padding: 20px 0;
  }

  .single-result h3 {
    margin: 0;
    color: var(--text-h);
  }

  .chip {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
  }

  .chip.ok {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.4);
  }

  .chip.warn {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .balance-big {
    font-size: 40px;
    font-weight: 800;
    color: var(--text-h);
    margin: 8px 0;
  }

  .balance-big small {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
  }

  .address-line {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    text-align: center;
    padding: 40px 20px;
  }

  .placeholder svg {
    width: 56px;
    height: 56px;
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.7;
  }

  .placeholder p {
    max-width: 280px;
    margin: 0;
    font-size: 14px;
  }

  .mass-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .mass-table th {
    text-align: left;
    padding: 8px 10px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--border);
  }

  .mass-table td {
    padding: 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-h);
  }

  .mass-table tr:last-child td {
    border-bottom: none;
  }

  .net-name {
    font-weight: 600;
  }

  .net-verify {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 6px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 800;
  }

  .net-verify.ok {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
  }

  .net-verify.bad {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .mass-table td:first-child,
  .mass-table td:nth-child(2) small {
    font-family: var(--mono);
  }

  .balance-cell {
    font-family: var(--mono);
    font-weight: 600;
  }

  .pending {
    color: #f59e0b;
  }

  .fail {
    color: #ef4444;
    font-weight: 600;
  }

  .pill {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
  }

  .pill.ok {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
  }

  .pill.fail {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .pill.pending {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.15);
  }

  .total-line {
    margin: 14px 0 0;
    font-size: 13px;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>