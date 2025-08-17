<script lang="ts">
	import { Layer } from 'svelte-canvas';
	interface Bounds {
		x0: number;
		y0: number;
		x1: number;
		y1: number;
	}

	const bounds = {
		x0: 0,
		y0: 0,
		x1: 100,
		y1: 100
	} as Bounds;

	function render({ context }: { context: CanvasRenderingContext2D }): void {
		const { x0, y0, x1, y1 } = bounds;

		context.strokeStyle = '#444';
		context.lineWidth = 2;
		context.strokeRect(x0, y0, x1 - x0, y1 - y0);

		context.globalAlpha = 0;
		context.fillRect(x0, y0, x1 - x0, y1 - y0);
		context.globalAlpha = 1;
	}
</script>

<Layer {render} />
