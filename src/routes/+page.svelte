<script lang="ts">
	import Splitter from '$lib/components/splitter/splitter.svelte';
	import Merger from '$lib/components/merger/merger.svelte';

	const tabs = [
		{ name: 'splitter', component: Splitter, label: 'WebM Maker' },
		{ name: 'merger', component: Merger, label: 'WebM Merger' }
	];

	let current_page = $state('splitter');
</script>

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
