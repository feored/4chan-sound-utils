<script lang="ts">
	import '$lib/css/style.css';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { version } from '$app/environment';
	import { Github } from '@lucide/svelte';
</script>

<header class="my-4">
	<h3>4chan sound utils</h3>
</header>

<slot />
<SvelteToast />
