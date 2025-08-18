<script lang="ts">
	import Splitter from '$lib/components/splitter/splitter.svelte';
	import Merger from '$lib/components/merger/merger.svelte';

	const tabs = [
		{ name: 'splitter', component: Splitter, label: 'WebM Maker' },
		{ name: 'merger', component: Merger, label: 'WebM Merger' }
	];

	let current_page = $state('splitter');
</script>

<header class="my-4">
	<h3>4chan sound utils</h3>
	<small>
		Utilities compatible with <a href="4chan-sounds-player">4chan Sounds Player</a>,
		<a href="https://sleazyfork.org/en/scripts/31045-4chan-external-sounds">4chan External Sounds</a
		>, etc.
	</small>
</header>
<main>
	<menu>
		{#each tabs as tab}
			<li onclick={() => (current_page = tab.name)} class:selected={current_page === tab.name}>
				{tab.label}
			</li>
		{/each}
	</menu>
	{#each tabs as tab (tab.name)}
		{#if current_page === tab.name}
			<svelte:component this={tab.component} />
		{/if}
	{/each}
</main>
