<script module>
	const direction_options = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'] as const;
	type Direction = (typeof direction_options)[number];

	type Point = {
		x: number;
		y: number;
	};

	type Bounds = {
		p0: Point;
		p1: Point;
	};

	const OUTSIDE_COLOR = '#000000CC';
</script>

<script lang="ts">
	interface CanvasControllerProps {
		video: HTMLVideoElement | null;
	}

	let { video }: CanvasControllerProps = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let dimensions = $state({ width: 0, height: 0 });
	let dragging = $state(false);
	let visible_handles = $state(false);
	let active_handle: Direction = $state('NW');

	let bounds = $state<Bounds>({
		p0: { x: 0, y: 0 },
		p1: { x: dimensions.width, y: dimensions.height }
	});

	let HANDLE_SIZE = $derived.by(() => {
		return 12;
	});

	// Reset when a new video is loaded
	$effect(() => {
		if (video) {
			video.addEventListener('loadedmetadata', reset);
		}
	});

	function reset(): void {
		dimensions = {
			width: video?.offsetWidth || 0,
			height: video?.offsetHeight || 0
		};
		bounds = {
			p0: { x: 0, y: 0 },
			p1: { x: dimensions.width, y: dimensions.height }
		};
	}

	function draw() {
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;

		context.clearRect(0, 0, dimensions.width, dimensions.height);
		draw_background(context);
		if (visible_handles) {
			draw_handles(context);
		}
	}

	function draw_background(context: CanvasRenderingContext2D): void {
		context.fillStyle = OUTSIDE_COLOR;
		context.fillRect(0, 0, bounds.p0.x, bounds.p0.y); // NW
		context.fillRect(bounds.p0.x, 0, bounds.p1.x - bounds.p0.x, bounds.p0.y); // N
		context.fillRect(bounds.p1.x, 0, dimensions.width - bounds.p1.x, bounds.p0.y); // NE
		context.fillRect(0, bounds.p0.y, bounds.p0.x, bounds.p1.y - bounds.p0.y); // W
		context.fillRect(
			bounds.p1.x,
			bounds.p0.y,
			dimensions.width - bounds.p1.x,
			bounds.p1.y - bounds.p0.y
		); // E
		context.fillRect(0, bounds.p1.y, bounds.p0.x, dimensions.height - bounds.p1.y); // SW
		context.fillRect(
			bounds.p0.x,
			bounds.p1.y,
			bounds.p1.x - bounds.p0.x,
			dimensions.height - bounds.p1.y
		); // S
		context.fillRect(
			bounds.p1.x,
			bounds.p1.y,
			dimensions.width - bounds.p1.x,
			dimensions.height - bounds.p1.y
		); // SE
	}

	function draw_handles(context: CanvasRenderingContext2D): void {
		if (!canvas) return;
		context.fillStyle = '#111';
		const handles = get_handles_origins();
		for (const direction of direction_options) {
			const handle = handles[direction];
			context.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
		}
	}

	$effect(() => {
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;
		draw();
	});

	function get_handles_origins() {
		const current_width = bounds.p1.x - bounds.p0.x;
		const current_height = bounds.p1.y - bounds.p0.y;
		const center_x = bounds.p0.x + current_width / 2 - HANDLE_SIZE / 2;
		const center_y = bounds.p0.y + current_height / 2 - HANDLE_SIZE / 2;
		const handles = {
			NW: { x: bounds.p0.x, y: bounds.p0.y },
			N: { x: center_x, y: bounds.p0.y },
			NE: { x: bounds.p1.x - HANDLE_SIZE, y: bounds.p0.y },
			W: { x: bounds.p0.x, y: center_y },
			E: { x: bounds.p1.x - HANDLE_SIZE, y: center_y },
			SW: { x: bounds.p0.x, y: bounds.p1.y - HANDLE_SIZE },
			S: { x: center_x, y: bounds.p1.y - HANDLE_SIZE },
			SE: { x: bounds.p1.x - HANDLE_SIZE, y: bounds.p1.y - HANDLE_SIZE }
		} as Record<Direction, Point>;

		return handles;
	}

	function get_potential_handle({ x, y }: { x: number; y: number }): Direction | null {
		const handles = get_handles_origins();
		for (const direction of direction_options) {
			const handle = handles[direction];
			if (
				x >= handle.x &&
				x <= handle.x + HANDLE_SIZE &&
				y >= handle.y &&
				y <= handle.y + HANDLE_SIZE
			) {
				return direction;
			}
		}
		return null;
	}

	function onmousedown(event: MouseEvent): void {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const potential_handle = get_potential_handle({ x, y });
		if (potential_handle) {
			canvas.style.cursor = `${potential_handle}-resize`;
			dragging = true;
			active_handle = potential_handle;
		}
	}

	function onmouseup(event: MouseEvent): void {
		if (!canvas || !dragging) return;
		canvas.style.cursor = 'auto';
		dragging = false;
	}

	function onmousemove(event: MouseEvent): void {
		if (!canvas) return;
		if (!dragging) {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const potential_handle = get_potential_handle({ x, y });
			if (potential_handle) {
				canvas.style.cursor = `${potential_handle}-resize`;
			} else {
				canvas.style.cursor = 'auto';
			}
		} else {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			switch (active_handle) {
				case 'NW':
					bounds.p0.x = Math.max(0, Math.min(dimensions.width, x));
					bounds.p0.y = Math.max(0, Math.min(dimensions.height, y));
					break;
				case 'N':
					bounds.p0.y = Math.max(0, Math.min(dimensions.height, y));
					break;
				case 'NE':
					bounds.p1.x = Math.max(0, Math.min(dimensions.width, x));
					bounds.p0.y = Math.max(0, Math.min(dimensions.height, y));
					break;
				case 'W':
					bounds.p0.x = Math.max(0, Math.min(dimensions.width, x));
					break;
				case 'E':
					bounds.p1.x = Math.max(0, Math.min(dimensions.width, x));
					break;
				case 'SW':
					bounds.p0.x = Math.max(0, Math.min(dimensions.width, x));
					bounds.p1.y = Math.max(0, Math.min(dimensions.height, y));
					break;
				case 'S':
					bounds.p1.y = Math.max(0, Math.min(dimensions.height, y));
					break;
				case 'SE':
					bounds.p1.x = Math.max(0, Math.min(dimensions.width, x));
					bounds.p1.y = Math.max(0, Math.min(dimensions.height, y));
					break;
			}

			// Redraw the canvas
			const context = canvas.getContext('2d');
			if (context) {
				draw();
			}
		}
	}

	function onmouseenter(): void {
		visible_handles = true;
	}

	function onmouseleave(): void {
		if (!dragging) {
			visible_handles = false;
		}
	}
</script>

<svelte:document {onmouseup} />
<canvas
	{onmousedown}
	{onmousemove}
	{onmouseenter}
	{onmouseleave}
	bind:this={canvas}
	width={dimensions.width}
	height={dimensions.height}
></canvas>

<style>
	canvas {
		touch-action: none;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;
	}
</style>
