<script>
  import { onMount, onDestroy } from 'svelte'
  import {
    CHAINS,
    account,
    balance,
    chainId,
    connected,
    paliInstalled,
    explorerUrlFor,
    formatAddress,
    getTransactionReceipt,
    initPali,
    isValidAddress,
    refreshBalance,
    sendTransfer,
  } from '../pali.js'

  const STATUS_LABELS = {
    idle: '',
    'Preparando': 'Preparando',
    'Esperando confirmación': 'Esperando confirmación',
    'Enviando': 'Enviando',
    'Confirmada': 'Confirmada',
    'Error': 'Error',
  }

  let to = $state('')
  let amount = $state('')
  let status = $state('idle')
  let txState = $state('')
  let hash = $state('')
  let blockNumber = $state('')
  let errorMsg = $state('')
  let timer = $state(null)

  const symbol = $derived(
    (CHAINS[$chainId] || { symbol: 'TSYS' }).symbol,
  )
  const sentAmount = $derived(
    amount && status !== 'idle' ? Number(amount) : null,
  )
  const explorerUrl = $derived(explorerUrlFor($chainId, hash))
  const origin = $derived(formatAddress($account))

  function resetForm() {
    to = ''
    amount = ''
    status = 'idle'
    txState = ''
    hash = ''
    errorMsg = ''
    clearTimer()
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  async function handleSend() {
    if (status === 'Preparando' || status === 'Esperando confirmación' || status === 'Enviando') {
      return
    }
    clearTimer()
    errorMsg = ''
    hash = ''
    blockNumber = ''
    txState = ''

    if (!$connected || !$account) {
      status = 'Error'
      errorMsg = 'No hay una cuenta conectada. Conéctala desde la pestaña Connect.'
      return
    }

    const amountNumber = Number(amount)
    if (!isValidAddress(to)) {
      status = 'Error'
      errorMsg = 'Dirección de destino inválida (0x + 40 caracteres hexadecimales).'
      return
    }
    if (!amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      status = 'Error'
      errorMsg = 'Introduce una cantidad válida mayor a 0.'
      return
    }

    status = 'Preparando'
    try {
      await refreshBalance()
      const available = Number($balance)
      if (amountNumber > available) {
        status = 'Error'
        errorMsg = 'Cantidad insuficiente. Tu saldo es menor al monto a enviar.'
        return
      }
    } catch {
      /* si no se puede leer el saldo, continuamos */
    }

    status = 'Esperando confirmación'
    try {
      hash = await sendTransfer({ to, amount: amountNumber })
      status = 'Enviando'
      txState = 'PENDIENTE'
      refreshBalance()
      pollReceipt(hash)
    } catch (err) {
      if (err?.code === 4001) {
        status = 'Error'
        errorMsg = 'Transacción rechazada por el usuario.'
      } else if (err?.code === -32002) {
        status = 'Error'
        errorMsg = 'Ya hay una solicitud pendiente. Revisa la ventana de Pali Wallet.'
      } else {
        status = 'Error'
        errorMsg = err?.message || 'No se pudo enviar la transacción.'
      }
    }
  }

  function pollReceipt(hashIn) {
    let attempts = 0
    timer = setInterval(async () => {
      attempts++
      try {
        const receipt = await getTransactionReceipt(hashIn)
        if (receipt) {
          clearTimer()
          if (receipt.status === '0x1') {
            status = 'Confirmada'
            txState = 'CONFIRMADA'
            blockNumber = receipt.blockNumber ? String(BigInt(receipt.blockNumber)) : ''
          } else {
            status = 'Error'
            txState = 'FALLIDA'
            blockNumber = receipt.blockNumber ? String(BigInt(receipt.blockNumber)) : ''
            errorMsg = 'La transacción fue minada pero falló en la cadena.'
          }
          refreshBalance()
        } else if (attempts >= 20) {
          clearTimer()
          txState = 'PENDIENTE'
        }
      } catch {
        if (attempts >= 20) {
          clearTimer()
          txState = 'PENDIENTE'
        }
      }
    }, 2500)
  }

  onMount(() => {
    initPali()
  })

  onDestroy(() => {
    clearTimer()
  })
</script>

<section class="page">
  <div class="head">
    <span class="tag">Wallet</span>
    <h1>Transfer</h1>
    <p>Envía {symbol} de tu cuenta de Pali Wallet hacia otra dirección.</p>
  </div>

  {#if !$paliInstalled}
    <div class="notice error">
      <h3>Pali Wallet no detectada</h3>
      <p>
        Instala la extensión <strong>Pali Wallet</strong> en tu navegador y
        recarga la página para poder enviar transacciones.
      </p>
    </div>
  {:else}
    <div class="layout">
      <div class="form-card">
        {#if !$connected}
          <div class="status-warn">
            <h3>Sin cuenta conectada</h3>
            <p>Ve a la pestaña <strong>Connect</strong> para conectar tu wallet antes de transferir.</p>
          </div>
        {:else}
          <div class="field">
            <label for="from">Cuenta origen</label>
            <div class="origin-row">
              <span class="avatar">{$account.slice(0, 2)}</span>
              <span class="origin-address" title={$account}>{origin}</span>
              <span class="balance-chip">
                {$balance} {symbol}
              </span>
            </div>
          </div>

          <div class="field">
            <label for="to">Dirección destino</label>
            <input
              id="to"
              type="text"
              placeholder="0x..."
              bind:value={to}
              spellcheck="false"
              autocomplete="off"
            />
          </div>

          <div class="field">
            <label for="amount">Cantidad ({symbol})</label>
            <div class="amount-row">
              <input
                id="amount"
                type="number"
                min="0"
                step="any"
                placeholder="0.0"
                bind:value={amount}
              />
              <button type="button" class="max-btn" onclick={() => (amount = $balance)}>
                Max
              </button>
            </div>
          </div>

          <button
            class="btn btn-primary"
            onclick={handleSend}
            disabled={status === 'Preparando' || status === 'Esperando confirmación' || status === 'Enviando'}
          >
            {#if status === 'Preparando'}
              Preparando…
            {:else if status === 'Esperando confirmación'}
              Esperando confirmación…
            {:else if status === 'Enviando'}
              Enviando…
            {:else}
              Enviar
            {/if}
          </button>

          <div class="step-row">
            <span class="step" class:active={status === 'Preparando'}>
              1. Preparando
            </span>
            <span class="step" class:active={status === 'Esperando confirmación'}>
              2. Confirma en Pali
            </span>
            <span class="step" class:active={status === 'Enviando' || status === 'Confirmada'}>
              3. Confirmada
            </span>
          </div>

          {#if errorMsg}
            <div class="error-msg">{errorMsg}</div>
          {/if}
        {/if}
      </div>

      <div class="result-card">
        {#if status === 'idle'}
          <div class="placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h13l-3-3 1.4-1.4L21 8l-5.6 5.4L14 12l3-3H4V7Z" />
              <path d="M20 17H7l3 3-1.4 1.4L3 16l5.6-5.4L10 12l-3 3h13v2Z" />
            </svg>
            <p>Las transferencias confirmadas aparecerán aquí con su hash y estado.</p>
          </div>
        {:else if status === 'Error'}
          <div class="result result-error">
            <span class="result-icon">✕</span>
            <h3>Transferencia no enviada</h3>
            {#if errorMsg}
              <p class="result-msg">{errorMsg}</p>
            {/if}
            {#if txState === 'FALLIDA' && hash}
              <div class="hash-block">
                <span class="hash-label">Hash</span>
                <span class="hash-value" title={hash}>{hash.slice(0, 18)}…{hash.slice(-6)}</span>
                {#if blockNumber}
                  <span class="hash-label">Bloque</span>
                  <span class="hash-value">{blockNumber}</span>
                {/if}
                <a class="explorer-link" href={explorerUrl} target="_blank" rel="noreferrer">
                  Ver en explorador ↗
                </a>
              </div>
            {/if}
            <button class="btn btn-secondary" onclick={resetForm}>Nueva transferencia</button>
          </div>
        {:else}
          <div class="result">
            <span class="result-icon ok">✓</span>
            <h3>{status === 'Confirmada' ? 'Transferencia confirmada' : 'Transferencia enviada'}</h3>

            {#if sentAmount !== null}
              <div class="amount">
                {sentAmount} <small>{symbol}</small>
              </div>
            {/if}

            <div class="result-block">
              <span class="hash-label">Desde</span>
              <span class="hash-value" title={$account}>{origin}</span>
            </div>
            <div class="result-block">
              <span class="hash-label">Hacia</span>
              <span class="hash-value" title={to}>{formatAddress(to)}</span>
            </div>

            <div class="result-block">
              <span class="hash-label">Hash</span>
              <span class="hash-value" title={hash}>{hash.slice(0, 18)}…{hash.slice(-6)}</span>
            </div>

            {#if blockNumber}
              <div class="result-block">
                <span class="hash-label">Bloque</span>
                <span class="hash-value">{blockNumber}</span>
              </div>
            {/if}

            <div class="tx-state" class:confirmed={txState === 'CONFIRMADA'} class:failed={txState === 'FALLIDA'}>
              {#if txState === 'CONFIRMADA'}
                ✅ CONFIRMADA
              {:else if txState === 'FALLIDA'}
                ⛔ FALLIDA
              {:else}
                ⏳ PENDIENTE
              {/if}
            </div>

            {#if explorerUrl}
              <a class="explorer-btn" href={explorerUrl} target="_blank" rel="noreferrer">
                🔎 Ver transacción
              </a>
            {/if}

            {#if status === 'Enviando' && txState === 'PENDIENTE'}
              <p class="pending-hint">
                La transacción está pendiente de ser minada. Puedes revisar su estado en el explorador.
              </p>
            {/if}

            <button class="btn btn-secondary" onclick={resetForm}>Nueva transferencia</button>
          </div>
        {/if}
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

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .form-card,
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

  .field input {
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

  .field input:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
    border-color: var(--accent-border);
  }

  .origin-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 50%;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
  }

  .origin-address {
    font-family: var(--mono);
    font-size: 15px;
    font-weight: 600;
    color: var(--text-h);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .balance-chip {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
  }

  .amount-row {
    display: flex;
    gap: 8px;
  }

  .amount-row input {
    flex: 1;
  }

  .max-btn {
    flex-shrink: 0;
    padding: 0 18px;
    border-radius: 10px;
    border: 1px solid var(--accent-border);
    background: var(--accent-bg);
    color: var(--accent);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
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
    width: 100%;
    margin-top: 18px;
    color: var(--text-h);
    border: 1px solid var(--accent-border);
    background: var(--accent-bg);
  }

  .step-row {
    display: flex;
    gap: 8px;
    margin-top: 18px;
    flex-wrap: wrap;
  }

  .step {
    flex: 1;
    min-width: 120px;
    padding: 8px 10px;
    border-radius: 10px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    opacity: 0.5;
    transition:
      opacity 0.2s,
      color 0.2s,
      border-color 0.2s;
  }

  .step.active {
    opacity: 1;
    color: var(--accent);
    border-color: var(--accent-border);
    background: var(--accent-bg);
  }

  .status-warn {
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
  }

  .status-warn h3 {
    margin: 0 0 6px;
    color: var(--text-h);
  }

  .status-warn p {
    margin: 0;
    font-size: 14px;
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

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    text-align: center;
    padding: 40px 20px;
    color: var(--text);
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
    max-width: 260px;
    font-size: 14px;
    margin: 0;
  }

  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
  }

  .result-error {
    gap: 12px;
  }

  .result-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    font-size: 22px;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
  }

  .result-icon.ok {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.35);
  }

  .result h3 {
    margin: 0;
    color: var(--text-h);
  }

  .result-msg {
    margin: 0;
    font-size: 14px;
  }

  .amount {
    font-size: 36px;
    font-weight: 800;
    color: var(--text-h);
  }

  .amount small {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
  }

  .result-block {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--border);
  }

  .hash-label {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .hash-value {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text-h);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hash-block {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
  }

  .tx-state {
    padding: 8px 18px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .tx-state.confirmed {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.4);
  }

  .tx-state.failed {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.4);
  }

  .explorer-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(135deg, var(--accent), #7c3aed);
    box-shadow: 0 8px 24px -8px var(--accent);
    font-weight: 600;
    font-size: 15px;
    text-decoration: none;
    transition: transform 0.15s;
  }

  .explorer-btn:hover {
    transform: translateY(-2px);
  }

  .explorer-link {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .explorer-link:hover {
    text-decoration: underline;
  }

  .pending-hint {
    margin: 0;
    font-size: 13px;
    max-width: 300px;
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
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>