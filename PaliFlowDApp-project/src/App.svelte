<script>
  import Sidebar from './lib/components/Sidebar.svelte'
  import Home from './lib/pages/Home.svelte'
  import Connect from './lib/pages/Connect.svelte'
  import Transfer from './lib/pages/Transfer.svelte'
  import Redes from './lib/pages/Redes.svelte'
  import { currentRoute } from './lib/router.js'
</script>

<div class="layout">
  <Sidebar />
  <main class="content">
    {#if $currentRoute === 'home'}
      <Home />
    {:else if $currentRoute === 'connect'}
      <Connect />
    {:else if $currentRoute === 'transfer'}
      <Transfer />
    {:else}
      <Redes />
    {/if}
  </main>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100svh;
  }

  .content {
    flex: 1;
    min-width: 0;
    width: 100%;
    display: flex;
  }

  @media (max-width: 700px) {
    .layout {
      flex-direction: column;
    }
  }
</style>