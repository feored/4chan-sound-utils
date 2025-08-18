<script lang="ts">
	import {
		type ExportSettings,
		type OutputFormat,
		type x264Preset,
		type x264Tune,
		type VP8Bitrate,
		x264PresetOptions,
		x264PresetOptionsFormatted,
		x264TuneOptions,
		x264TuneOptionsFormatted,
		vp8BitrateOptions
	} from '$lib/ffmpeg/types';

	type SettingsProps = {
		export_settings?: ExportSettings;
		is_image: boolean;
	};
	let { export_settings = $bindable(), is_image } = $props();

	let x264_preset: x264Preset = $state('fast'); // Default preset for x264 encoding
	let x264_tune: x264Tune = $state('none'); // Default tune for x264 encoding

	let webm_bitrate: VP8Bitrate = $state('1M'); // Default bitrate for webm encoding
	let output_format: OutputFormat = $state('mp4'); // Default output format

	$effect(() => {
		x264_tune = is_image ? 'stillimage' : 'none'; // Set tune based on whether the input is an image
	});

	$effect(() => {
		if (output_format === 'mp4') {
			export_settings = {
				output_format: output_format,
				settings: {
					preset: x264_preset,
					tune: x264_tune
				}
			};
		} else if (output_format === 'webm') {
			export_settings = {
				output_format: output_format,
				settings: {
					bitrate: webm_bitrate
				}
			};
		}
	});
</script>

<div class="flash bd-muted">
	<p><b>FFmpeg settings</b></p>
	<fieldset>
		<legend>Output format</legend>
		<p>MP4 highly recommended.</p>
		<div class="options">
			<label>
				<input type="radio" name="output_format" value="mp4" bind:group={output_format} />
				MP4 (H.264)
			</label>
			<label>
				<input type="radio" name="output_format" value="webm" bind:group={output_format} />
				WebM (VP8 + 256k Vorbis)
			</label>
		</div>
	</fieldset>
	{#if output_format === 'webm'}
		<fieldset>
			<legend>Target Bitrate</legend>
			<div class="options">
				{#each vp8BitrateOptions as bitrate}
					<label>
						<input type="radio" name="webm_bitrate" value={bitrate} bind:group={webm_bitrate} />
						{bitrate}
					</label>
				{/each}
			</div>
		</fieldset>
	{:else}
		<fieldset>
			<legend>Preset</legend>
			<p>Slower will yield higher quality encodes.</p>
			<div class="options">
				{#each x264PresetOptions as p, i}
					<label>
						<input type="radio" name="preset" value={p} bind:group={x264_preset} />
						{x264PresetOptionsFormatted[i]}
					</label>
				{/each}
			</div>
		</fieldset>
		<fieldset>
			<legend>Tune</legend>
			<p>
				Optimize the output for specific content types. <br />Pick <i>Still Image</i> if your input is
				an image file.
			</p>
			<div class="options">
				{#each x264TuneOptions as t, i}
					<label>
						<input type="radio" name="tune" value={t} bind:group={x264_tune} />
						{x264TuneOptionsFormatted[i]}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}
</div>

<style>
	.options {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
	}
</style>
