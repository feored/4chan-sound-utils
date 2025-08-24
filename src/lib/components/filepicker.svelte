<script lang="ts">
	const video_formats = ['video/mp4', 'video/webm'];
	const image_formats = ['image/jpeg', 'image/png', 'image/gif'];

	interface FilepickerProps {
		current_file?: File | null;
		accept_video?: boolean;
		accept_image?: boolean;
		show_preview?: boolean;
	}

	let {
		current_file = $bindable(),
		accept_video = true,
		accept_image = true
	}: FilepickerProps = $props();

	let accepted_formats = $derived.by(() => {
		const formats = [];
		if (accept_video) formats.push(...video_formats);
		if (accept_image) formats.push(...image_formats);
		return formats;
	});

	let files: FileList | null = $state(null);
	$effect(() => {
		if (files && files.length > 0) {
			current_file = files[0];
		} else {
			current_file = null;
		}
	});
</script>

<div>
	<div class="flash bd-muted bg-accent">
		<label for="source_media" style="font-weight:bold;">Upload a video or image</label>
		<input
			accept={accepted_formats.join(',')}
			bind:files
			id="source_media"
			name="source_media"
			type="file"
		/>
	</div>
</div>

<style>
</style>
