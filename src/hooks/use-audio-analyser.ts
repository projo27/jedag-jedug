"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

type AudioSourceType = 'mic' | 'file' | 'system';

export function useAudioAnalyser(
  sourceType: AudioSourceType,
  fileUrl: string | undefined,
  isPlaying: boolean,
  onSongEnd: () => void
) {
  const [data, setData] = useState<Uint8Array | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const micRef = useRef<Tone.UserMedia | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>();

  const setupAudio = useCallback(async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Audio context started.');
      }
      if (!analyserRef.current) {
        analyserRef.current = new Tone.Analyser('waveform', 256);
      }
    } catch (e) {
      console.error("Could not start audio context", e);
    }
  }, []);

  const disconnectSources = useCallback(() => {
    micRef.current?.close();
    micRef.current?.disconnect();
    micRef.current = null;
    playerRef.current?.stop();
    playerRef.current?.disconnect();

    if (streamSourceNodeRef.current) {
      streamSourceNodeRef.current.disconnect();
      streamSourceNodeRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectSources();
      playerRef.current?.dispose();
      analyserRef.current?.dispose();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [disconnectSources]);

  useEffect(() => {
    const manageAudio = async () => {
      await setupAudio();
      if (!analyserRef.current) return;

      disconnectSources();

      if (isPlaying) {
        if (sourceType === 'mic') {
          try {
            micRef.current = new Tone.UserMedia();
            await micRef.current.open();
            micRef.current.connect(analyserRef.current);
          } catch(e) {
            console.error("Microphone access denied.", e);
          }
        } else if (sourceType === 'file' && fileUrl) {
          if (playerRef.current?.url !== fileUrl) {
            playerRef.current?.dispose();
            playerRef.current = new Tone.Player({
              url: fileUrl,
              onstop: onSongEnd,
            }).toDestination();
            playerRef.current.connect(analyserRef.current);
            await Tone.loaded();
          }
          if (playerRef.current && playerRef.current.state !== 'started') {
            playerRef.current.start();
          }
        } else if (sourceType === 'system') {
          try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            streamRef.current = stream;

            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    onSongEnd();
                };
            }

            if (stream.getAudioTracks().length > 0) {
                const audioContext = Tone.context;
                streamSourceNodeRef.current = audioContext.createMediaStreamSource(stream);
                streamSourceNodeRef.current.connect(analyserRef.current);
            } else {
                console.warn("Selected media has no audio track.");
                onSongEnd();
            }
          } catch(e) {
              console.error("System audio capture failed or was cancelled.", e);
              onSongEnd();
          }
        }
      }
    };

    manageAudio();

  }, [sourceType, fileUrl, isPlaying, setupAudio, disconnectSources, onSongEnd]);

  useEffect(() => {
    const analyse = () => {
      if (analyserRef.current && isPlaying) {
        const value = analyserRef.current.getValue();
        if (value instanceof Uint8Array) {
          setData(value);
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(analyse);
    };

    if (isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(analyse);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      setData(new Uint8Array(256).fill(128));
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying]);

  return data;
}
