import { writable } from 'svelte/store'

export const NETWORKS = [
  {
    key: 'evm-rollux',
    type: 'EVM',
    chainIdHex: '0x23a',
    name: 'Rollux',
    symbol: 'SYS',
    currencyName: 'Syscoin',
    rpc: 'https://rpc.rollux.com',
    explorer: 'https://explorer.rollux.com',
  },
  {
    key: 'evm-sys-main',
    type: 'EVM',
    chainIdHex: '0x39',
    name: 'Syscoin NEVM',
    symbol: 'SYS',
    currencyName: 'Syscoin',
    rpc: 'https://rpc.syscoin.org',
    explorer: 'https://explorer.syscoin.org',
  },
  {
    key: 'evm-eth',
    type: 'EVM',
    chainIdHex: '0x1',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    currencyName: 'Ether',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
  },
  {
    key: 'evm-polygon',
    type: 'EVM',
    chainIdHex: '0x89',
    name: 'Polygon Mainnet',
    symbol: 'POL',
    currencyName: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
  },
  {
    key: 'evm-sys-test',
    type: 'EVM',
    chainIdHex: '0x1644',
    name: 'Syscoin NEVM Testnet',
    symbol: 'TSYS',
    currencyName: 'Syscoin',
    rpc: 'https://rpc.tanenbaum.io',
    explorer: 'https://explorer.tanenbaum.io',
  },
  {
    key: 'evm-zk-tanenbaum',
    type: 'EVM',
    chainIdHex: '0xdee1',
    name: 'zkTanenbaum Testnet',
    symbol: 'TSYS',
    currencyName: 'Syscoin',
    rpc: 'https://rpc-zk.tanenbaum.io',
    explorer: 'https://explorer-zk.tanenbaum.io',
  },
  {
    key: 'evm-hoodi',
    type: 'EVM',
    chainIdHex: '0x88bb0',
    name: 'Ethereum Hoodi',
    symbol: 'ETH',
    currencyName: 'Ether',
    rpc: 'https://rpc.hoodi.ethpandaops.io',
    explorer: 'https://hoodi.etherscan.io',
  },
  {
    key: 'evm-sepolia',
    type: 'EVM',
    chainIdHex: '0xaa36a7',
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    currencyName: 'Ether',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
  },
]

export const CHAINS = Object.fromEntries(
  NETWORKS.map((network) => [
    network.chainIdHex,
    { name: network.name, symbol: network.symbol, explorer: network.explorer },
  ]),
)

export const UTXO_NETWORKS = NETWORKS.filter((n) => n.type === 'UTXO')
export const EVM_NETWORKS = NETWORKS.filter((n) => n.type === 'EVM')

export function getNetwork(key) {
  return NETWORKS.find((n) => n.key === key)
}

export const provider = writable(null)
export const connected = writable(false)
export const account = writable('')
export const balance = writable('0')
export const chainId = writable('0x1')
export const paliInstalled = writable(true)

let _provider = null
let _account = ''

export function isValidAddress(address) {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address)
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

export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function toWeiHex(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Cantidad inválida')
  }
  const [whole, dec = ''] = amount.toString().split('.')
  const decimals = (dec + '000000000000000000').slice(0, 18)
  const wei = BigInt(whole) * 10n ** 18n + BigInt(decimals)
  return `0x${wei.toString(16)}`
}

export function getPaliEthereumProvider(timeoutMs = 300) {
  const declared = []
  const onProvider = (event) => declared.push(event.detail)
  window.addEventListener('eip6963:announceProvider', onProvider)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  return new Promise((resolve) => {
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onProvider)
      if (window.ethereum?.isPali) return resolve(window.ethereum)
      const match = declared.find(({ info }) => {
        const name = String(info?.name || '').toLowerCase()
        const rdns = String(info?.rdns || '').toLowerCase()
        return name.includes('pali') || rdns.includes('pali')
      })
      resolve(match?.provider || window.ethereum || null)
    }, timeoutMs)
  })
}

export async function refreshBalance() {
  if (!_provider || !_account) return
  try {
    const hex = await _provider.request({
      method: 'eth_getBalance',
      params: [_account, 'latest'],
    })
    balance.set(formatBalance(hex))
  } catch {
    balance.set('0')
  }
}

async function updateAccount(newAccount) {
  _account = newAccount
  account.set(newAccount)
  connected.set(true)
  await refreshBalance()
  try {
    const id = await _provider.request({ method: 'eth_chainId' })
    chainId.set(id)
  } catch {
    /* chainId queda como está */
  }
}

function handleAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    _account = ''
    account.set('')
    connected.set(false)
    balance.set('0')
    return
  }
  updateAccount(accounts[0])
}

export function initPali() {
  getPaliEthereumProvider().then(async (p) => {
    _provider = p
    provider.set(p)
    if (!p) {
      paliInstalled.set(false)
      return
    }
    paliInstalled.set(true)

    p.on('accountsChanged', handleAccountsChanged)
    p.on('chainChanged', (id) => {
      chainId.set(id)
      refreshBalance()
    })

    try {
      const [existing] =
        (await p.request({ method: 'eth_accounts', params: [] })) || []
      if (existing) {
        await updateAccount(existing)
      }
    } catch {
      /* sin conexión previa */
    }
  })
}

export async function connect() {
  if (!_provider) throw new Error('Pali Wallet no detectada')
  const accounts = await _provider.request({
    method: 'eth_requestAccounts',
    params: [],
  })
  if (accounts && accounts.length > 0) {
    await updateAccount(accounts[0])
    return accounts[0]
  }
  return ''
}

export async function changeAccount() {
  if (!_provider) throw new Error('Pali Wallet no detectada')
  try {
    await _provider.request({ method: 'wallet_changeAccount', params: [] })
    const accounts = await _provider.request({ method: 'eth_accounts', params: [] })
    const next = accounts?.[0]
    if (next) await updateAccount(next)
  } catch (err) {
    if (err?.code === 4200 || err?.message?.includes('not supported')) {
      return connect()
    }
    throw err
  }
}

export async function disconnect() {
  if (_provider) {
    try {
      await _provider.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      })
    } catch {
      /* si falla, igual limpiamos el estado local */
    }
  }
  _account = ''
  account.set('')
  connected.set(false)
  balance.set('0')
}

function isUnrecognizedChain(err) {
  return (
    err?.code === 4902 ||
    err?.code === -32602 ||
    err?.code === -32603 ||
    /unrecognized chain|could not switch|chain not added|unable to switch|not exist|no.*found/i.test(
      String(err?.message || ''),
    )
  )
}

function isAlreadyAdded(err) {
  return (
    err?.code === 4901 ||
    (err?.code === 4001 && /cancel/i.test(String(err?.message || ''))) ||
    /already (exist|added|previously added|available)|duplicate|network.*exists|already configured/i.test(
      String(err?.message || ''),
    )
  )
}

async function addEthereumChain(network) {
  if (!network.rpc && !network.nevmRpc) {
    throw new Error('Red sin RPC configurado para añadirla')
  }
  await _provider.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: network.chainIdHex,
        chainName: network.name,
        nativeCurrency: {
          name: network.currencyName || network.symbol,
          symbol: network.symbol,
          decimals: 18,
        },
        rpcUrls: [network.rpc || network.nevmRpc],
        blockExplorerUrls: [network.explorer],
      },
    ],
  })
}

async function ensureNetworkAdded(network) {
  try {
    await addEthereumChain(network)
  } catch (err) {
    if (err?.code === 4001) throw err
    if (!isAlreadyAdded(err)) throw err
  }
}

export async function switchNetwork(network) {
  if (!network) throw new Error('Red no válida')

  if (network.type === 'EVM') {
    if (!_provider) throw new Error('Pali Wallet no detectada')
    try {
      await switchToChain(network.chainIdHex)
    } catch (err) {
      if (err?.code === 4001) throw err
      if (!isUnrecognizedChain(err)) throw err
      await ensureNetworkAdded(network)
      await switchToChain(network.chainIdHex)
    }
    return
  }

  if (network.type === 'UTXO') {
    const pali = window.pali
    if (!pali) {
      throw new Error('Proveedor UTXO no detectado')
    }
    try {
      await switchSysChain(pali, network.chainId)
    } catch (err) {
      if (err?.code === 4001) throw err
      if (!isUnrecognizedChain(err)) throw err
      await ensureNetworkAdded(network)
      await switchSysChain(pali, network.chainId)
    }
  }
}

async function switchToChain(chainIdHex) {
  await _provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chainIdHex }],
  })
}

async function switchSysChain(pali, chainId) {
  await pali.request({
    method: 'sys_switchChain',
    params: [{ chainId }],
  })
}

export async function sendTransfer({ to, amount }) {
  if (!_provider) throw new Error('Pali Wallet no detectada')
  if (!_account) throw new Error('No hay una cuenta conectada')
  if (!isValidAddress(to)) throw new Error('Dirección de destino inválida')
  const value = toWeiHex(amount)
  const hash = await _provider.request({
    method: 'eth_sendTransaction',
    params: [{ from: _account, to, value }],
  })
  return hash
}

export async function getTransactionReceipt(hash) {
  return _provider.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  })
}

export function explorerUrlFor(chainIdHex, hash) {
  const chain = CHAINS[chainIdHex]
  return chain?.explorer && hash ? chain.explorer + '/tx/' + hash : ''
}