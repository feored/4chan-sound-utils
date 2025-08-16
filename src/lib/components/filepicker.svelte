<script lang="ts">
	import { get_file_type } from '$lib/utils';
	import byteSize from 'byte-size';
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
		accept_image = true,
		show_preview = true
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
	<div class="flash accent">
		<label for="source_media" style="font-weight:bold;">Upload a video or image.</label>
		<input
			accept={accepted_formats.join(',')}
			bind:files
			id="source_media"
			name="source_media"
			type="file"
		/>
	</div>
	{#if files}
		{#each Array.from(files) as file}
			<!-- <p>Original size: {byteSize(file.size, { units: 'iec' })}</p> -->
			{#if show_preview}
				{#if get_file_type(file.name) === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video controls>
						<source src={URL.createObjectURL(file)} type={file.type} />
						Your browser does not support the video tag.
					</video>
				{:else if get_file_type(file.name) === 'image'}
					<img src={URL.createObjectURL(file)} alt="Selected image" />
				{/if}
			{/if}
		{/each}
	{/if}
</div>

<style>
</style>
