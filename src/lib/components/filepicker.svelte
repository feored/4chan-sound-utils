<script>
	import { get_file_type } from '$lib/utils';
	import byteSize from 'byte-size';
	const video_formats = ['video/mp4', 'video/webm'];
	const image_formats = ['image/jpeg', 'image/png', 'image/gif'];

	let { files = $bindable() } = $props();

	let img = $state();
	let vid = $state();

	$effect(() => {
		if (files) {
			// Note that `files` is of type `FileList`, not an Array:
			// https://developer.mozilla.org/en-US/docs/Web/API/FileList
			console.log(files);
		}
	});
</script>

<label for="source_media">Upload a video or image.</label>
<input
	accept={video_formats + ', ' + image_formats}
	bind:files
	id="source_media"
	name="source_media"
	type="file"
/>
{#if files}
	{#each Array.from(files) as file}
		<p>Filesize: {byteSize(file.size, { units: 'iec' })}</p>
		<div id="media">
			{#if get_file_type(file.name) === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video controls>
					<source src={URL.createObjectURL(file)} type={file.type} />
					Your browser does not support the video tag.
				</video>
			{:else if get_file_type(file.name) === 'image'}
				<img bind:this={img} src={URL.createObjectURL(file)} alt="Selected image" />
			{/if}
		</div>
	{/each}
{/if}

<style>
	#media {
		max-width: 50%;
	}
</style>
