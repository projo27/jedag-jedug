"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useAudioAnalyser } from '@/hooks/use-audio-analyser';
import type { VisualizationParameters } from '@/types';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/button';

interface VisualizationCanvasProps {
  shaderCode: string;
  params: VisualizationParameters;
  audioSource: 'mic' | 'file' | 'system';
  audioFileUrl?: string;
  isPlaying: boolean;
  onPlayToggle: (playing: boolean) => void;
  isRecording: boolean;
}

export function VisualizationCanvas({
  shaderCode,
  params,
  audioSource,
  audioFileUrl,
  isPlaying,
  onPlayToggle,
  isRecording
}: VisualizationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const audioTextureRef = useRef<THREE.DataTexture | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleAudioEnd = useCallback(() => {
    onPlayToggle(false);
  }, [onPlayToggle]);

  const audioData = useAudioAnalyser(audioSource, audioFileUrl, isPlaying, handleAudioEnd);

  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    timeoutId = setTimeout(() => setShowControls(false), 3000);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeoutId);
    };
}, []);


  const startRecording = useCallback(() => {
    if (!canvasRef.current || isRecording) return;
    const stream = canvasRef.current.captureStream(60);
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recordedChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    mediaRecorderRef.current.start();
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jedag-jedug-visualization.webm';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      recordedChunksRef.current = [];
    };
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording]);


  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      if (materialRef.current) {
        materialRef.current.uniforms.iResolution.value.set(width, height);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Geometry and Material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: shaderCode,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        iAudio: { value: null },
        u_color1: { value: new THREE.Color(params.color1) },
        u_color2: { value: new THREE.Color(params.color2) },
        u_speed: { value: params.speed },
        u_intensity: { value: params.intensity },
      },
    });
    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (!renderer || !scene || !camera || !material) return;
      material.uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.fragmentShader = shaderCode;
      materialRef.current.needsUpdate = true;
    }
  }, [shaderCode]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_color1.value.set(params.color1);
      materialRef.current.uniforms.u_color2.value.set(params.color2);
      materialRef.current.uniforms.u_speed.value = params.speed;
      materialRef.current.uniforms.u_intensity.value = params.intensity;
    }
  }, [params]);

  useEffect(() => {
    if (audioData && materialRef.current) {
      // audioData is a Float32Array of dB values.
      // We need to normalize it to a 0-1 range for the shader.
      const normalizedData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        // Map dB range [-100, -20] to [0, 1].
        const db = audioData[i];
        if (db === -Infinity) {
          normalizedData[i] = 0;
          continue;
        }
        const normalized = Math.max(0, Math.min(1, (db + 100) / 80));
        normalizedData[i] = normalized;
      }

      if (!audioTextureRef.current || audioTextureRef.current.image.width !== normalizedData.length) {
        if (audioTextureRef.current) {
            audioTextureRef.current.dispose();
        }
        audioTextureRef.current = new THREE.DataTexture(normalizedData, normalizedData.length, 1, THREE.RedFormat, THREE.FloatType);
        audioTextureRef.current.needsUpdate = true;
      } else {
        audioTextureRef.current.image.data = normalizedData;
        audioTextureRef.current.needsUpdate = true;
      }
      materialRef.current.uniforms.iAudio.value = audioTextureRef.current;
    }
  }, [audioData]);

  return (
    <div className="absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full" />
      {audioSource === 'file' && audioFileUrl && (
        <div className={cn("absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Button variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm hover:bg-primary/40" onClick={() => onPlayToggle(!isPlaying)}>
                {isPlaying ? <Pause className="w-8 h-8 text-primary-foreground" /> : <Play className="w-8 h-8 text-primary-foreground" />}
            </Button>
        </div>
      )}
    </div>
  );
}
