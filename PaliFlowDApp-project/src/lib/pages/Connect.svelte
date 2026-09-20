<script>
  import { onMount } from 'svelte'
  import {
    CHAINS,
    EVM_NETWORKS,
    UTXO_NETWORKS,
    account,
    balance,
    chainId,
    connected,
    getNetwork,
    paliInstalled,
    connect,
    changeAccount,
    disconnect,
    formatAddress,
    initPali,
    switchNetwork,
  } from '../pali.js'

  let connecting = $state(false)
  let errorMsg = $state('')
  let copied = $state(false)
  let networkMsg = $state('')

  const address = $derived(formatAddress($account))
  const chain = $derived(CHAINS[$chainId] || { name: 'Desconocida', symbol: 'TOK' })

  function selectedNetworkKey(id) {
    return (
      EVM_NETWORKS.find((n) => n.chainIdHex === id)?.key ||
      UTXO_NETWORKS.find((n) => n.chainIdHex === id)?.key ||
      'evm-eth'
    )
  }

  async function onConnect() {
    if (connecting) return
    connecting = true
    errorMsg = ''
    try {
      await connect()
    } catch (err) {
      errorMsg = translateError(err)
    } finally {
      connecting = false
    }
  }

  async function onChangeAccount() {
    errorMsg = ''
    try {
      await changeAccount()
    } catch (err) {
      errorMsg = translateError(err)
    }
  }

  async function onDisconnect() {
    errorMsg = ''
    await disconnect()
  }

  async function onSwitchNetwork(key) {
    errorMsg = ''
    networkMsg = ''
    try {
      const network = getNetwork(key)
      if (!network) throw new Error('Red no reconocida')
      await switchNetwork(network)
      networkMsg = `Red cambiada a ${network.name}.`
    } catch (err) {
      if (err?.code === 4902) {
        errorMsg = 'La red no estaba añadida; se intentó añadir automáticamente.'
      } else if (err?.code !== 4001) {
        errorMsg = translateError(err)
      }
    }
  }

  async function onCopy() {
    if (!$account) return
    try {
      await navigator.clipboard.writeText($account)
      copied = true
      setTimeout(() => (copied = false), 1600)
    } catch {
      /* clipboard no disponible */
    }
  }

  function translateError(err) {
    const code = err?.code
    if (code === 4001 || code === -32603) {
      return 'Solicitud rechazada por el usuario.'
    }
    if (code === -32002) {
      return 'Ya hay una solicitud pendiente. Revisa la ventana de Pali Wallet.'
    }
    if (code === 4902) {
      return 'La red no está disponible en tu Pali Wallet.'
    }
    if (code === 4100) {
      return 'La cuenta no está autorizada. Vuelve a conectar.'
    }
    return err?.message || 'Ocurrió un error inesperado.'
  }

  onMount(() => {
    initPali()
  })
</script>

<section class="page">
  <div class="head">
    <span class="tag">Wallet</span>
    <h1>Connect</h1>
    <p>Conecta tu cartera Pali usando su selector nativo de cuentas.</p>
  </div>

  {#if !$paliInstalled}
    <div class="notice error">
      <h3>Pali Wallet no detectada</h3>
      <p>
        Instala la extensión <strong>Pali Wallet</strong> en tu navegador y
        recarga la página para poder conectar tu cartera.
      </p>
    </div>
  {:else}
    <div class="layout">
      <div class="panel">
        <div class="status">
          <span class="dot" class:online={$connected}></span>
          <span class="status-text">
            {$connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {#if !$connected}
          <button class="btn btn-primary" onclick={onConnect} disabled={connecting}>
            {connecting ? 'Conectando…' : 'Conectar Wallet'}
          </button>
          <p class="hint">
            Al pulsar el botón, Pali Wallet abrirá su ventana de permisos para que
            elijas la cuenta que quieres conectar.
          </p>
        {:else}
          <div class="account-card">
            <div class="account-row">
              <span class="avatar">{$account.slice(0, 2)}</span>
              <div class="account-meta">
                <span class="account-label">Cuenta activa</span>
                <span class="account-address" title={$account}>{address}</span>
              </div>
              <span class="badge">Conectada</span>
            </div>

            <div class="actions">
              <button class="btn btn-secondary" onclick={onChangeAccount}>
                Cambiar cuenta
              </button>
              <button class="btn btn-danger" onclick={onDisconnect}>
                Desconectar
              </button>
            </div>
          </div>
          <p class="hint">
            "Cambiar cuenta" vuelve a abrir el selector nativo de Pali Wallet para
            que elijas otra cuenta y confirmes.
          </p>
        {/if}

        {#if errorMsg}
          <div class="error-msg">{errorMsg}</div>
        {/if}
      </div>

      <div class="details">
        <div class="details-head">
          <h2>Detalles de cuenta</h2>
          <span class="details-chip" class:on={$connected}>
            {$connected ? 'Conectada' : 'Sin conectar'}
          </span>
        </div>

        <div class="details-body">
          <dl>
            <div class="detail">
              <dt>Dirección</dt>
              <dd class="detail-address">
                <span title={$account}>
                  {$connected ? address : '—'}
                </span>
                {#if $connected}
                  <button class="copy-btn" onclick={onCopy}>
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                {/if}
              </dd>
            </div>

            <div class="detail">
              <dt>Saldo</dt>
              <dd class="detail-balance">
                {#if $connected}
                  {$balance} <small>{chain.symbol}</small>
                {:else}
                  —
                {/if}
              </dd>
            </div>

            <div class="detail">
              <dt>Red</dt>
              <dd>
                {#if $connected}
                  <select
                    value={selectedNetworkKey($chainId)}
                    onchange={(e) => onSwitchNetwork(e.currentTarget.value)}
                  >
                    <optgroup label="UTXO Networks">
                      {#each UTXO_NETWORKS as network}
                        <option value={network.key}>{network.name}</option>
                      {/each}
                    </optgroup>
                    <optgroup label="EVM Networks">
                      {#each EVM_NETWORKS as network}
                        <option value={network.key}>{network.name}</option>
                      {/each}
                    </optgroup>
                  </select>
                  {#if networkMsg}
                    <span class="network-msg">{networkMsg}</span>
                  {/if}
                {:else}
                  —
                {/if}
              </dd>
            </div>

            <div class="detail">
              <dt>Chain ID</dt>
              <dd class="mono">{$connected ? $chainId : '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .page {
    padding: clamp(32px, 5vw, 56px) clamp(24px, 6vw, 72px);
    width: 100%;
    box-sizing: border-box;
    color: var(--text);
  }

  .head {
    margin-bottom: 28px;
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
    max-width: 560px;
  }

  .panel {
    max-width: 520px;
    padding: 32px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    box-shadow: var(--shadow);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .details {
    padding: 28px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    box-shadow: var(--shadow);
  }

  .details-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }

  .details-head h2 {
    margin: 0;
    font-size: 20px;
    color: var(--text-h);
  }

  .details-chip {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
  }

  .details-chip.on {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.3);
  }

  .details-body dl {
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }

  .detail:last-child {
    border-bottom: none;
  }

  .detail dt {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
  }

  .detail dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-h);
    overflow: hidden;
    min-width: 0;
  }

  .detail dd select {
    max-width: 200px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-h);
    font-size: 14px;
    font-weight: 600;
  }

  .network-msg {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #22c55e;
    text-align: right;
  }

  .detail-address {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-address span {
    font-family: var(--mono);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--accent-border);
    background: var(--accent-bg);
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .copy-btn:hover {
    transform: translateY(-1px);
  }

  .detail-balance {
    font-size: 20px !important;
  }

  .detail-balance small {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
  }

  .mono {
    font-family: var(--mono);
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg);
    margin-bottom: 24px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--border);
  }

  .dot.online {
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
  }

  .status-text {
    color: var(--text-h);
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

  .btn-primary {
    width: 100%;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
    box-shadow: 0 8px 24px -8px var(--accent);
  }

  .btn-secondary {
    color: var(--text-h);
    border: 1px solid var(--accent-border);
    background: var(--accent-bg);
  }

  .btn-danger {
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.1);
  }

  .hint {
    margin: 16px 0 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .account-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .account-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
  }

  .account-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .account-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .account-address {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-h);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .actions .btn {
    flex: 1;
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

  .notice {
    max-width: 520px;
    padding: 24px 28px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    box-shadow: var(--shadow);
  }

  .notice.error {
    border-color: rgba(239, 68, 68, 0.4);
  }

  .notice h3 {
    margin: 0 0 8px;
    color: var(--text-h);
  }

  .notice p {
    margin: 0;
  }

  @media (max-width: 700px) {
    .panel {
      padding: 24px;
    }

    .layout {
      grid-template-columns: 1fr;
    }

    .actions {
      flex-direction: column;
    }
  }
</style>