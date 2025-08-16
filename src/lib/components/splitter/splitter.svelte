<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import Seekbar from '$lib/components/splitter/seekbar.svelte';
	import VideoControls from '$lib/components/splitter/video_controls.svelte';

	import { type Stream } from '$lib/ffmpeg/ffmpeg_types';
	import { format_ffmpeg_time } from '$lib/utils';
	import { ffmpeg, set_ffmpeg_busy, is_ffmpeg_busy, listen } from '$lib/ffmpeg/ffmpeg.svelte';
	import { fetchFile } from '@ffmpeg/util';
	import { toast } from '@zerodevx/svelte-toast';
	import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';

	let current_file: File | null = $state(null);
	let video: HTMLVideoElement | null = $state(null);
	let progress: number = $state(0);
	let duration: number = $state(0);
	let current_time: number = $state(0);

	let start_progress: number = $state(0);
	let end_progress: number = $state(1);

	let final_stream: Stream = $state({
		name: '',
		blob: new Blob()
	});

	let loading_message = $state('');
	let ffmpeg_message = $state('');

	function listen_ffmpeg_message(event: LogEvent) {
		let formatted_message = `[${event.type}]: ${event.message}`;
		console.log(formatted_message);
		ffmpeg_message = formatted_message;
	}

	function listen_ffmpeg_progress(event: ProgressEvent) {
		const progress = event.progress * 100;
		loading_message = `Splitting video... ${progress.toFixed(2)}%`;
	}

	function on_start_seek(progress: number) {
		start_progress = progress;
		on_start_end_seek();
	}

	function on_end_seek(progress: number) {
		end_progress = progress;
		on_start_end_seek();
	}

	function on_start_end_seek() {
		if (start_progress > end_progress) {
			end_progress = start_progress + 0.05;
		} else if (end_progress < start_progress) {
			start_progress = end_progress - 0.05;
		}

		if (!video) return;
		if (progress < start_progress) {
			progress = start_progress;
			video.currentTime = progress * video.duration;
		} else if (progress > end_progress) {
			progress = end_progress;
			video.currentTime = progress * video.duration;
		}
	}

	function on_seek(progress: number) {
		if (!video) return;
		if (isNaN(video.duration)) return;
		video.currentTime = progress * video.duration;
	}

	ondurationchange = (_event: Event) => {
		if (!video) return;
		duration = video.duration;
	};

	function stop() {
		if (!video) return;
		video.pause();
		video.currentTime = start_progress * video.duration;
	}

	function ontimeupdate(_event: Event) {
		if (!video) return;
		progress = video.currentTime / video.duration;
		current_time = video.currentTime;
		if (progress < start_progress) {
			video.currentTime = start_progress * video.duration;
		} else if (progress > end_progress) {
			if (!video.loop) {
				video.pause();
				video.currentTime = end_progress * video.duration;
			} else {
				video.currentTime = start_progress * video.duration;
			}
		}
	}

	async function get_sound_extension(stream: Stream): Promise<string | null> {
		set_ffmpeg_busy(true);
		await ffmpeg.writeFile(stream.name, await fetchFile(stream.blob));
		let command = `-select_streams a:0 -show_entries stream=codec_name -of csv=p=0 ${stream.name} -o output.txt`;
		await ffmpeg.ffprobe(command.split(' '));
		const data = await ffmpeg.readFile('output.txt');
		set_ffmpeg_busy(false);
		if (!data) {
			toast.push('Failed to get sound extension.');
			return null;
		}
		const data_array = data as Uint8Array;
		const utf8_decoder = new TextDecoder(); // utf8 is the default
		return utf8_decoder.decode(data_array).trim();
	}

	async function upload_file(file: File): Promise<string | null> {
		// Placeholder for file upload logic
		// This should return the URL of the uploaded file

		const form_data = new FormData();
		form_data.append('reqtype', 'fileupload');
		form_data.append('fileToUpload', file);
		console.log('Uploading file:', file.name);

		try {
			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				// Set the FormData instance as the request body
				body: form_data
			});
			let resp = await response.text();
			console.log('Upload response:', resp);
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
		set_ffmpeg_busy(true);
		console.log('Extracting audio from video:', current_file.name);
		await ffmpeg.writeFile(current_file.name, await fetchFile(current_file));
		console.log('wrote file to ffmpeg:', current_file.name);
		let command = [
			'-y',
			'-ss',
			format_ffmpeg_time(start_time),
			'-i',
			current_file.name,
			'-map',
			'0:a:0',
			'-ss',
			format_ffmpeg_time(start_time),
			'-t',
			format_ffmpeg_time(trim_duration),
			'-c:a',
			'libvorbis',
			'-b:a',
			'192k',
			'output.ogg'
		];
		await ffmpeg.exec(command);
		console.log('Executed ffmpeg command: ffmpeg', command.join(' '));
		const audio_blob = await ffmpeg.readFile(`output.ogg`);
		console.log('Read audio blob from ffmpeg');
		set_ffmpeg_busy(false);
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
		console.log('Processing video:', current_file.name);
		set_ffmpeg_busy(true);
		await ffmpeg.writeFile(current_file.name, await fetchFile(current_file));
		console.log('wrote file to ffmpeg:', current_file.name);

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
		await ffmpeg.exec(command);
		console.log('Executed ffmpeg command: ffmpeg ', command.join(' '));
		const video_blob = await ffmpeg.readFile(`output.webm`);
		console.log('Read video blob from ffmpeg');
		set_ffmpeg_busy(false);
		return new Blob([video_blob], { type: `video/webm` });
	}

	async function split() {
		console.log('Splitting audio from video...');
		listen(true, listen_ffmpeg_message, listen_ffmpeg_progress);
		if (!current_file) {
			toast.push('No file selected.');
			return;
		}
		const start_time = (start_progress / 100) * duration;
		const trim_duration = (end_progress / 100 - start_progress / 100) * duration;

		let audio_stream = await extract_audio(start_time, trim_duration);
		if (!audio_stream) {
			toast.push('Failed to extract audio from video.');
			return;
		}
		console.log('Audio extracted');
		let audio_file = new File([audio_stream.blob], audio_stream.name, {
			type: audio_stream.blob.type
		});
		let audio_url = await upload_file(audio_file);
		if (!audio_url) {
			toast.push('Failed to upload audio.');
			return;
		}
		audio_url = encodeURIComponent(audio_url);
		console.log('Audio uploaded:', audio_url);
		let video_blob = await process_video(start_time, trim_duration);
		if (!video_blob) {
			toast.push('Failed to process video.');
			return;
		}
		console.log('Video processed');
		final_stream = {
			name: current_file.name.replace(/\.[^/.]+$/, '') + `[sound=${audio_url}].webm`,
			blob: video_blob
		};
		listen(false, listen_ffmpeg_message, listen_ffmpeg_progress);

		//let extension = await get_sound_extension({ name: current_file.name, blob: current_file });
		//console.log('Sound extension:', extension);
	}
</script>

<article>
	<header>
		<h3>Splitter (WebM Maker)</h3>
		<small>
			Splits the audio from a video file and uploads it to one of the approved hosts, then removes
			the audio from the video file.
		</small>
	</header>
	<Filepicker bind:current_file accept_image={false} show_preview={false} />
	{#if current_file}
		<hr />
		<VideoControls {video} {stop} {duration} />
		<br />
		<section>
			<Seekbar
				{on_seek}
				{progress}
				{current_time}
				{duration}
				{start_progress}
				{end_progress}
				{on_start_seek}
				{on_end_seek}
			/>
		</section>
		<video
			bind:this={video}
			src={URL.createObjectURL(current_file)}
			{ondurationchange}
			{ontimeupdate}
		>
			Your browser does not support the video tag.
		</video>
		<button
			onclick={() => {
				split();
			}}>Split</button
		>
		<article>
			<p>{loading_message} <span class="loader"></span></p>
			<code>{ffmpeg_message}</code>
		</article>

		<a
			href={URL.createObjectURL(final_stream.blob)}
			download={final_stream.name}
			title="Download processedvideo"><button>Download</button></a
		>
	{/if}
</article>

<style>
	video {
		width: 100%;
		height: auto;
		max-height: 75vh;
	}
</style>
