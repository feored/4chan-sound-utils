<script lang="ts">
	import { get_file_type } from '$lib/utils/files';
	import byteSize from 'byte-size';

	interface PreviewProps {
		current_file: File | null;
	}

	let { current_file }: PreviewProps = $props();
</script>

{#if current_file}
	<div class="flash bd-muted">
		<p><b>Preview</b></p>
		<p><code>Original size: {byteSize(current_file.size, { units: 'iec' })}</code></p>
		{#if get_file_type(current_file.name) === 'video'}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video controls>
				<source src={URL.createObjectURL(current_file)} type={current_file.type} />
				Your browser does not support the video tag.
			</video>
		{:else if get_file_type(current_file.name) === 'image'}
			<img src={URL.createObjectURL(current_file)} alt="Selected image" />
		{/if}
	</div>
{/if}
