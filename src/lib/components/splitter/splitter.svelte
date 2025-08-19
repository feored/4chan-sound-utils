<script module lang="ts">
	export interface VideoData {
		progress: number;
		current_time: number;
		duration: number;
		start_progress: number;
		end_progress: number;
	}
	const default_video_data: VideoData = {
		progress: 0,
		current_time: 0,
		duration: 0,
		start_progress: 0,
		end_progress: 1
	};
</script>

<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import Seekbar from '$lib/components/splitter/trim/seekbar.svelte';
	import VideoControls from '$lib/components/splitter/video_controls.svelte';
	import CanvasController from '$lib/components/splitter/crop/canvas_controller.svelte';
	import Log from '../log.svelte';

	import { MessageManager } from '$lib/utils/message_manager.svelte';
	import { type Stream } from '$lib/ffmpeg/types';
	import { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
	import { format_ffmpeg_time } from '$lib/utils/utils';
	import { fetchFile } from '@ffmpeg/util';
	import { toast } from '@zerodevx/svelte-toast';
	import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';
	import { onMount } from 'svelte';

	let current_file: File | null = $state(null);
	let video: HTMLVideoElement | null = $state(null);
	let video_data: VideoData = $state(default_video_data);
	let last_seek_preview: boolean = $state(false);
	const message_manager = new MessageManager();
	const ffmpeg_manager = new FFmpegManager();

	onMount(() => {
		// Default video ontimeupdate evemt fires too slowly, makes it choppy
		setInterval(function () {
			ontimeupdate(new Event('ontimeupdate'));
		}, 50);

		ffmpeg_manager.init();
	});

	$effect(() => {
		if (current_file) {
			video_data = default_video_data;
		}
	});

	let final_stream: Stream = $state({
		name: '',
		blob: new Blob()
	});

	function on_start_seek(progress: number, preview = false) {
		video_data.start_progress = progress;
		if (video_data.start_progress > video_data.end_progress) {
			video_data.end_progress = video_data.start_progress + 0.05;
		}
		if (!video) return;
		if (preview) {
			video.currentTime = progress * video.duration;
			last_seek_preview = true;
		}
		if (video_data.progress < video_data.start_progress) {
			video_data.progress = video_data.start_progress;
		}
	}

	function on_end_seek(progress: number, preview = false) {
		video_data.end_progress = progress;
		if (video_data.end_progress < video_data.start_progress) {
			video_data.start_progress = video_data.end_progress - 0.05;
		}
		if (!video) return;
		if (preview) {
			video.currentTime = progress * video.duration;
			last_seek_preview = true;
		}
		if (video_data.progress > video_data.end_progress) {
			video_data.progress = video_data.end_progress;
		}
	}

	function on_seek(progress: number) {
		if (!video) return;
		if (isNaN(video.duration)) return;
		if (progress < video_data.start_progress) {
			video_data.progress = video_data.start_progress;
		} else if (progress > video_data.end_progress) {
			video_data.progress = video_data.end_progress;
		}
		video.currentTime = progress * video.duration;
		last_seek_preview = false;
	}

	function ondurationchange() {
		if (!video) return;
		video_data.duration = video.duration;
	}

	function ontimeupdate(_event: Event) {
		if (!video) return;
		if (last_seek_preview) {
			last_seek_preview = false;
			return;
		}
		video_data.progress = video.currentTime / video.duration;
		video_data.current_time = video.currentTime;
		if (video_data.progress < video_data.start_progress - 0.01) {
			// Epsilon to avoid floating point issues
			video.currentTime = video_data.start_progress * video.duration;
		} else if (video_data.progress > video_data.end_progress) {
			if (!video.loop) {
				video.pause();
				video.currentTime = video_data.end_progress * video.duration;
			} else {
				video.currentTime = video_data.start_progress * video.duration;
			}
		}
	}

	// async function get_sound_extension(stream: Stream): Promise<string | null> {
	// 	set_ffmpeg_busy(true);
	// 	await ffmpeg.writeFile(stream.name, await fetchFile(stream.blob));
	// 	let command = `-select_streams a:0 -show_entries stream=codec_name -of csv=p=0 ${stream.name} -o output.txt`;
	// 	await ffmpeg.ffprobe(command.split(' '));
	// 	const data = await ffmpeg.readFile('output.txt');
	// 	set_ffmpeg_busy(false);
	// 	if (!data) {
	// 		toast.push('Failed to get sound extension.');
	// 		return null;
	// 	}
	// 	const data_array = data as Uint8Array;
	// 	const utf8_decoder = new TextDecoder(); // utf8 is the default
	// 	return utf8_decoder.decode(data_array).trim();
	// }

	async function upload_file(file: File): Promise<string | null> {
		const form_data = new FormData();
		form_data.append('reqtype', 'fileupload');
		form_data.append('fileToUpload', file);
		message_manager.add('upload_audio', `Uploading audio: ${file.name}...`);

		try {
			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				// Set the FormData instance as the request body
				body: form_data
			});
			let resp = await response.text();
			message_manager.add('upload_audio_response', resp);
			return resp;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	async function extract_audio(start_time: number, trim_duration: number) {
		if (!current_file) {
			return;
		}
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			return;
		}
		message_manager.add('extract_audio', `Extracting audio from ${current_file.name}...`);
		// https://superuser.com/a/704118
		const fast_skip_start = Math.floor(0.9 * start_time); // Skip 90% of the start time quickly but approximately,
		console.log(
			`fast_skip_start: ${fast_skip_start}, start_time: ${start_time}, trim_duration: ${trim_duration}`
		);
		// then seek to the exact start time
		const rest_skip_start = start_time - fast_skip_start;
		console.log(`rest_skip_start: ${rest_skip_start}`);
		console.log(fast_skip_start + rest_skip_start, 'should equal start_time:', start_time);
		await ffmpeg.writeFile(current_file.name, await fetchFile(current_file));
		let command = [
			'-y',
			'-ss',
			format_ffmpeg_time(fast_skip_start),
			'-i',
			current_file.name,
			'-map',
			'0:a:0',
			'-ss',
			format_ffmpeg_time(rest_skip_start),
			'-t',
			format_ffmpeg_time(trim_duration),
			'-c:a',
			'libvorbis',
			'-b:a',
			'192k',
			'output.ogg'
		];
		message_manager.add('ffmpeg_command_extract_audio', `Running ffmpeg ${command.join(' ')}`);
		await ffmpeg.exec(command);
		const audio_blob = await ffmpeg.readFile(`output.ogg`);
		message_manager.add('audio_extracted', `Audio extracted from ${current_file.name}`);
		const blob = new Blob([audio_blob], { type: `audio/ogg` });
		return {
			name: 'output.ogg',
			blob: blob
		};
	}

	async function process_video(start_time: number, trim_duration: number) {
		if (!current_file) {
			return;
		}
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			return;
		}
		message_manager.add('process_video', `Processing video: ${current_file.name}...`);
		await ffmpeg.writeFile(current_file.name, await fetchFile(current_file));

		// https://superuser.com/a/704118
		let command = [
			'-y',
			'-ss',
			format_ffmpeg_time(start_time),
			'-i',
			current_file.name,
			'-map',
			'0:v:0',
			'-ss',
			format_ffmpeg_time(start_time),
			'-c:v',
			'libvpx',
			'-b:v',
			'2M',
			'-t',
			format_ffmpeg_time(trim_duration),
			'output.webm'
		];
		message_manager.add('ffmpeg_command_process_video', `Running ffmpeg ${command.join(' ')}`);
		await ffmpeg.exec(command);
		const video_blob = await ffmpeg.readFile(`output.webm`);
		return new Blob([video_blob], { type: `video/webm` });
	}

	async function split() {
		message_manager.reset();
		message_manager.add('split', 'Splitting audio and video...');
		if (!current_file) {
			message_manager.add('split_error', 'No file selected.');
			return;
		}
		const start_time = video_data.start_progress * video_data.duration;
		const trim_duration =
			(video_data.end_progress - video_data.start_progress) * video_data.duration;

		let audio_stream = await extract_audio(start_time, trim_duration);
		if (!audio_stream) {
			message_manager.add('extract_error', 'Failed to extract audio from video.');
			return;
		}
		let audio_file = new File([audio_stream.blob], audio_stream.name, {
			type: audio_stream.blob.type
		});
		//let audio_url = await upload_file(audio_file);
		let audio_url = 'https://files.catbox.moe/ijpeep.mp3';
		if (!audio_url) {
			message_manager.add('upload_error', 'Failed to upload audio file.');
			return;
		}
		audio_url = encodeURIComponent(audio_url);
		let video_blob = await process_video(start_time, trim_duration);
		if (!video_blob) {
			message_manager.add('process_error', 'Failed to process video.');
			return;
		}

		final_stream = {
			name: current_file.name.replace(/\.[^/.]+$/, '') + `[sound=${audio_url}].webm`,
			blob: video_blob
		};
		message_manager.add('split_success', 'Audio and video split successfully.');
		message_manager.add(
			'final_stream',
			`Final video: ${final_stream.name} (${final_stream.blob.size} bytes)`
		);

		//let extension = await get_sound_extension({ name: current_file.name, blob: current_file });
		//console.log('Sound extension:', extension);
	}
</script>

<Filepicker bind:current_file accept_image={false} show_preview={false} />

{#if current_file}
	<section>
		<section>
			<VideoControls {video} {video_data} />
			<Seekbar {video_data} {on_seek} {on_start_seek} {on_end_seek} />
		</section>
		<div class="media-container">
			<video
				bind:this={video}
				src={URL.createObjectURL(current_file)}
				{ondurationchange}
				{onresize}
			>
				Your browser does not support the video tag.
			</video>
			<CanvasController {video} />
		</div>
	</section>
	<button
		onclick={() => {
			split();
		}}>Split</button
	>
	<Log {message_manager} {ffmpeg_manager} />

	<a
		href={URL.createObjectURL(final_stream.blob)}
		download={final_stream.name}
		title="Download processedvideo"><button>Download</button></a
	>
{:else}
	<div class="flash bg-muted bd-muted">
		<p><b class="default">Instructions</b></p>
		<p>
			Upload a video, trim it and crop it.<br />This tool will then split the audio and video into
			separate files.<br />
			The audio file will automatically be uploaded to one of several hosts, with the URL embedded in
			the video's filename.
		</p>
	</div>
{/if}

<style>
</style>
