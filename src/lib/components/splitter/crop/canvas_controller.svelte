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

	type Surface = {
		origin: Point;
		width: number;
		height: number;
	};

	const OUTSIDE_COLOR = '#000000E6';
	const HANDLE_SIZE = 12; // Size of the resize handles
	const MIN_CROP = 64;
</script>

<script lang="ts">
	interface CanvasControllerProps {
		video: HTMLVideoElement | null;
	}

	let { video }: CanvasControllerProps = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let dimensions = $state({ width: 0, height: 0 });
	let real_dimensions = $state({ width: 0, height: 0 });
	let dragging = $state(false);
	let visible_handles = $state(false);
	let previous_touch: Point = $state({ x: 0, y: 0 });
	let active_handle: Direction | 'surface' = $state('NW');

	let bounds = $state<Bounds>({
		p0: { x: 0, y: 0 },
		p1: { x: dimensions.width, y: dimensions.height }
	});

	// Reset when a new video is loaded
	$effect(() => {
		if (video) {
			console.dir(video);
			video.addEventListener('loadedmetadata', reset);
		}
	});

	function reset(): void {
		if (!canvas || !video) return;
		dimensions = {
			width: video.offsetWidth,
			height: video.offsetHeight
		};
		real_dimensions = {
			width: video.videoWidth,
			height: video.videoHeight
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
			draw_border(context);
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

	function draw_border(context: CanvasRenderingContext2D): void {
		context.strokeStyle = '#111';
		context.lineWidth = 2;
		context.strokeRect(
			bounds.p0.x,
			bounds.p0.y,
			bounds.p1.x - bounds.p0.x,
			bounds.p1.y - bounds.p0.y
		);
	}

	function draw_handles(context: CanvasRenderingContext2D): void {
		if (!canvas) return;
		context.fillStyle = '#FFF';
		context.strokeStyle = '#111';
		context.lineWidth = 1;
		const handles = get_handles_origins();
		for (const direction of direction_options) {
			const handle = handles[direction];
			context.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
			context.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
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

	function get_overlapping_handle({
		x,
		y
	}: {
		x: number;
		y: number;
	}): Direction | 'surface' | null {
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
		if (x >= bounds.p0.x && x <= bounds.p1.x && y >= bounds.p0.y && y <= bounds.p1.y) {
			return 'surface';
		}
		return null;
	}

	function onmousedown(event: MouseEvent): void {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const overlap_handle = get_overlapping_handle({ x, y });
		if (overlap_handle) {
			if (overlap_handle === 'surface') {
				canvas.style.cursor = 'move';
				previous_touch = { x, y };
			} else {
				canvas.style.cursor = `${overlap_handle}-resize`;
			}
			dragging = true;
			active_handle = overlap_handle;
			return;
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
			const overlap_handle = get_overlapping_handle({ x, y });
			if (overlap_handle) {
				if (overlap_handle === 'surface') {
					canvas.style.cursor = 'move';
					visible_handles = true;
				} else {
					canvas.style.cursor = `${overlap_handle}-resize`;
					visible_handles = false;
				}
			} else {
				canvas.style.cursor = 'auto';
				visible_handles = false;
			}
			return;
		}

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		if (active_handle === 'surface') {
			// If dragging on the surface, we can move the entire crop area
			const deltaX = x - previous_touch.x;
			const deltaY = y - previous_touch.y;
			const new_bounds = {
				p0: {
					x: bounds.p0.x + deltaX,
					y: bounds.p0.y + deltaY
				},
				p1: {
					x: bounds.p1.x + deltaX,
					y: bounds.p1.y + deltaY
				}
			};

			if (new_bounds.p0.x > 0 && new_bounds.p1.x < dimensions.width) {
				bounds.p0.x = new_bounds.p0.x;
				bounds.p1.x = new_bounds.p1.x;
			}
			if (new_bounds.p0.y > 0 && new_bounds.p1.y < dimensions.height) {
				bounds.p0.y = new_bounds.p0.y;
				bounds.p1.y = new_bounds.p1.y;
			}

			previous_touch = { x, y };
		} else {
			let new_bounds = {
				p0: { ...bounds.p0 },
				p1: { ...bounds.p1 }
			} as Bounds;
			if (active_handle.includes('N')) {
				new_bounds.p0.y = Math.max(0, Math.min(bounds.p1.y, y));
			} else if (active_handle.includes('S')) {
				new_bounds.p1.y = Math.min(dimensions.height, Math.max(bounds.p0.y, y));
			}

			if (new_bounds.p1.y - new_bounds.p0.y >= MIN_CROP) {
				bounds.p0.y = new_bounds.p0.y;
				bounds.p1.y = new_bounds.p1.y;
			}

			if (active_handle.includes('W')) {
				new_bounds.p0.x = Math.max(0, Math.min(bounds.p1.x, x));
			} else if (active_handle.includes('E')) {
				new_bounds.p1.x = Math.min(dimensions.width, Math.max(bounds.p0.x, x));
			}

			if (new_bounds.p1.x - new_bounds.p0.x >= MIN_CROP) {
				bounds.p0.x = new_bounds.p0.x;
				bounds.p1.x = new_bounds.p1.x;
			}
		}

		// Redraw the canvas
		const context = canvas.getContext('2d');
		if (context) {
			draw();
		}
	}

	function onmouseleave(): void {
		if (!dragging) {
			visible_handles = false;
		}
	}

	function calc_crop(): Surface {
		if (!canvas || !video) return { origin: { x: 0, y: 0 }, width: 0, height: 0 };
		const ratio = video.videoWidth / video.offsetWidth;
		const crop_width = Math.round((bounds.p1.x - bounds.p0.x) * ratio);
		const crop_height = Math.round((bounds.p1.y - bounds.p0.y) * ratio);
		const crop_origin = {
			x: Math.round(bounds.p0.x * ratio),
			y: Math.round(bounds.p0.y * ratio) // Adjust for the canvas offset
		};
		return {
			origin: crop_origin,
			width: crop_width,
			height: crop_height
		};
	}
</script>

<svelte:document {onmouseup} {onmousemove} />
<canvas
	{onmousedown}
	{onmouseenter}
	{onmouseleave}
	bind:this={canvas}
	width={dimensions.width}
	height={dimensions.height}
></canvas>
<div>
	<code>
		Cropped: {calc_crop().width} x {calc_crop().height} - Original: {real_dimensions.width} x {real_dimensions.height}
	</code>
</div>

<style>
	.mono-text {
		font-family: var(--ft-mono);
		font-size: 0.85rem;
	}

	canvas {
		touch-action: none;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;
	}
</style>
