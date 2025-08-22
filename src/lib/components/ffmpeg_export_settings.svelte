<script lang="ts">
	import {
		type ExportSettings,
		type OutputFormat,
		type x264Preset,
		type x264Tune,
		x264PresetOptions,
		x264PresetOptionsFormatted,
		x264TuneOptions,
		x264TuneOptionsFormatted
	} from '$lib/ffmpeg/types';
	import { is_image } from '$lib/utils/files';
	import byteSize from 'byte-size';

	type SettingsProps = {
		export_settings?: ExportSettings;
		file_name: string;
	};
	let { export_settings = $bindable(), file_name }: SettingsProps = $props();

	let x264_preset: x264Preset = $state('fast'); // Default preset for x264 encoding
	let x264_bitrate: number = $state(2048); // Default bitrate for x264 encoding

	let webm_bitrate: number = $state(2048); // Default bitrate for webm encoding
	let output_format: OutputFormat = $state('mp4'); // Default output format

	let x264_tune: x264Tune = $derived.by(() => {
		return is_image(file_name) ? 'stillimage' : 'none'; // Automatically set tune based on input type
	});

	$effect(() => {
		if (output_format === 'mp4') {
			export_settings = {
				output_format: output_format,
				settings: {
					preset: x264_preset,
					tune: x264_tune,
					bitrate: x264_bitrate
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
		<div>
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
			<input
				name="webm_bitrate_range"
				type="range"
				min="256"
				max="65536"
				step="256"
				bind:value={webm_bitrate}
			/>
			<label for="webm_bitrate_range">Up to {byteSize((webm_bitrate * 1000) / 8)}/s</label>
		</fieldset>
	{:else}
		<div>
			<fieldset>
				<legend>Target Bitrate</legend>
				<input
					name="x264_bitrate_range"
					type="range"
					min="256"
					max="65536"
					step="256"
					bind:value={x264_bitrate}
				/>
				<label for="x264_bitrate_range">Up to {byteSize((x264_bitrate * 1000) / 8)}/s</label>
			</fieldset>
			<fieldset>
				<legend>Preset</legend>
				<p>Slower will yield higher quality encodes.</p>
				<select bind:value={x264_preset}
					>{#each x264PresetOptions as p, i}
						<option value={p} selected={x264_preset === p}>
							{x264PresetOptionsFormatted[i]}
						</option>
					{/each}
				</select>
			</fieldset>
			<fieldset>
				<legend>Tune</legend>
				<p>
					Optimize the output for specific content types. <br />Pick <i>Still Image</i> if your input
					is an image file.
				</p>
				<select bind:value={x264_tune}
					>{#each x264TuneOptions as t, i}
						<option value={t} selected={x264_tune === t}>
							{x264TuneOptionsFormatted[i]}
						</option>
					{/each}
				</select>
			</fieldset>
		</div>
	{/if}
</div>

<style>
	.settings-container {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}
	@media screen and (max-width: 990px) {
		.settings-container {
			flex-direction: column;
		}
	}
</style>
