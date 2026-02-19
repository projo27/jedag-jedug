"use client";

import { useState, useCallback, useMemo } from "react";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ControlPanel } from "@/components/control-panel";
import { VisualizationCanvas } from "@/components/visualization-canvas";
import type { VisualizationParameters } from "@/types";

const defaultShader = `// Default shader: "Cosmic Pulse" - Beat Reactive
// by AI & Studio
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iAudio; // Frequency data (FFT)
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_speed;
uniform float u_intensity;


vec3 palette( float t, vec3 a, vec3 b, vec3 c, vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    // --- Beat Detection ---
    // Average the low frequencies (bass/kick drums) for a "beat" value.
    // The iAudio texture contains FFT data, with low frequencies at the start.
    float beat = 0.0;
    for (int i = 0; i < 16; i++) {
        // Sample the first 16 frequency bins.
        beat += texture2D(iAudio, vec2(float(i) / 1024.0, 0.5)).r;
    }
    beat /= 16.0;
    
    // Amplify the effect for more impact.
    float audio = beat * u_intensity * 2.0;

    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * (1.5 + audio * 0.5)) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + iTime*u_speed, u_color1, u_color2, vec3(1.0), vec3(0.263,0.416,0.557));

        d = sin(d*8. + iTime * u_speed)/8.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }
        
    gl_FragColor = vec4(finalColor, 1.0);
}`;


export default function Home() {
  const [shaderCode, setShaderCode] = useState<string>(defaultShader);
  const [shaderDescription, setShaderDescription] = useState<string>('A default shader that creates a pulsing, cosmic-like visual effect that reacts subtly to audio input.');
  const [params, setParams] = useState<VisualizationParameters>({
    color1: "#d62ee2",
    color2: "#8029cc",
    speed: 0.5,
    intensity: 1.0,
  });
  const [audioSource, setAudioSource] = useState<'mic' | 'file' | 'system'>('mic');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const audioFileUrl = useMemo(() => audioFile ? URL.createObjectURL(audioFile) : undefined, [audioFile]);

  const handleShaderGenerated = useCallback((newShader: string, newDescription: string) => {
    setShaderCode(newShader);
    setShaderDescription(newDescription);
  }, []);

  const handleParamChange = useCallback((newParams: Partial<VisualizationParameters>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const handleAudioSourceChange = useCallback((source: 'mic' | 'file' | 'system') => {
    setAudioSource(source);
    setIsPlaying(false);
    setAudioFile(null);
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    setAudioFile(file);
    if (file) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const handlePlayToggle = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);
  
  const handleRecordToggle = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <ControlPanel
          onShaderGenerated={handleShaderGenerated}
          onParamChange={handleParamChange}
          onAudioSourceChange={handleAudioSourceChange}
          onFileChange={handleFileChange}
          onPlayToggle={handlePlayToggle}
          onRecordToggle={handleRecordToggle}
          params={params}
          shaderCode={shaderCode}
          shaderDescription={shaderDescription}
          audioSource={audioSource}
          isPlaying={isPlaying}
          isRecording={isRecording}
        />
      </Sidebar>
      <SidebarInset>
        <main className="relative flex h-dvh w-full flex-col items-center justify-center bg-background">
          <VisualizationCanvas
            shaderCode={shaderCode}
            params={params}
            audioSource={audioSource}
            audioFileUrl={audioFileUrl}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            isRecording={isRecording}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
