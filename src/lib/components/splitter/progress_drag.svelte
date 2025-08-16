<script lang="ts">
	import type { Snippet } from 'svelte';
	import { on } from 'svelte/events';

	interface DraggableProps {
		progress: number;
		drag_object: Snippet;
		seekbar: HTMLDivElement;
		on_seek?: (progress: number) => void;
	}
	let { progress, drag_object, seekbar, on_seek }: DraggableProps = $props();

	let dragging = $state(false);
	let self: HTMLDivElement | null = $state(null);

	let seekbar_rect = $derived.by(() => seekbar.getBoundingClientRect());
	let self_width = $derived.by(() => (self ? self.getBoundingClientRect().width : 0));
	let seekbar_width = $derived(seekbar_rect.width - self_width);

	function onmousedown(event: MouseEvent) {
		dragging = true;
	}

	function onmouseup(event: MouseEvent) {
		if (!dragging || !self || !seekbar) return;
		dragging = false;
	}

	function onmousemove(event: MouseEvent) {
		if (!dragging || !self || !seekbar) return;
		let bar_progress = (event.clientX - seekbar_rect.left) / seekbar_width;
		progress = Math.max(0, Math.min(1, bar_progress)); // Clamp between 0 and 1
		on_seek?.(progress);
	}
</script>

<svelte:document {onmouseup} {onmousemove} />
<div
	bind:this={self}
	class="draggable"
	style:left="{progress * 100}%"
	{onmouseenter}
	{onmousedown}
	{onmousemove}
>
	{@render drag_object()}
</div>

<style>
	.draggable {
		position: absolute;
		cursor: ew-resize;
		height: 100%;
	}
</style>
