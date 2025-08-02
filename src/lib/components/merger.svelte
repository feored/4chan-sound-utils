<script>
	import Filepicker from '$lib/components/filepicker.svelte';
	import { get_url, get_file_type } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	let files = $state();
	let current_file = $derived.by(() => {
		if (files && files.length > 0) {
			return files[0];
		}
		return null;
	});

	function merge() {
		download_sound();
	}
	function download_sound() {
		let url = get_url(current_file.name);
		if (!url) {
			toast.push('Invalid sound URL.');
			return;
		}
		if (get_file_type(url) !== 'audio') {
			toast.push('Sound URL file format is not supported.');
			return;
		}
		console.log('Downloading sound from URL:', url);
		fetch(url)
			.then((response) => {
				if (!response.ok) {
					toast.push('Failed to download sound.');
					return;
				}
				return response.blob();
			})
			.then((blob) => {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = url;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				toast.push('Sound downloaded successfully.');
			})
			.catch((error) => {
				console.error('Error downloading sound:', error);
				toast.push('Error downloading sound.');
			});
	}
</script>

<article>
	<h3>Merger</h3>
	<Filepicker bind:files />
	{#if current_file}
		<div>
			<button onclick={() => merge()}>Merge</button>
		</div>
	{/if}
</article>
