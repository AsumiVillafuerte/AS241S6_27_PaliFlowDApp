import { writable } from 'svelte/store'

export const routes = ['home', 'connect', 'transfer', 'redes']

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return routes.includes(hash) ? hash : 'home'
}

export const currentRoute = writable(getRoute())

/** @param {string} route */
export function navigate(route) {
  const target = routes.includes(route) ? route : 'home'
  if (getRoute() === target) return
  window.location.hash = `/${target}`
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentRoute.set(getRoute())
  })
}