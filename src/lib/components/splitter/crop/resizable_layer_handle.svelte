<script lang="ts">
	import { Layer } from 'svelte-canvas';

	let { x, y, active = false, ...eventHandlers } = $props();

	function render({ context }: { context: CanvasRenderingContext2D }): void {
		context.fillStyle = active ? '#111' : '#444';
		context.fillRect(x - 6, y - 6, 12, 12);
	}
</script>

<Layer {render} {...eventHandlers} />
