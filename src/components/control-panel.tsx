"use client";

import React from 'react';
import type { VisualizationParameters } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShaderGeneratorForm } from '@/components/shader-generator-form';
import { Github, Music, SlidersHorizontal, Video, Wand2 } from 'lucide-react';

interface ControlPanelProps {
  onShaderGenerated: (shaderCode: string, description: string) => void;
  onParamChange: (newParams: Partial<VisualizationParameters>) => void;
  onAudioSourceChange: (source: 'mic' | 'file') => void;
  onFileChange: (file: File | null) => void;
  onPlayToggle: (playing: boolean) => void;
  onRecordToggle: (recording: boolean) => void;
  params: VisualizationParameters;
  shaderCode: string;
  shaderDescription: string;
  audioSource: 'mic' | 'file';
  isPlaying: boolean;
  isRecording: boolean;
}

export function ControlPanel({
  onShaderGenerated,
  onParamChange,
  onAudioSourceChange,
  onFileChange,
  onPlayToggle,
  onRecordToggle,
  params,
  shaderDescription,
  audioSource,
  isPlaying,
  isRecording,
}: ControlPanelProps) {

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold font-headline">jedag-jedug</h1>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <Accordion type="multiple" defaultValue={['audio-source', 'shader-generator', 'visual-controls']} className="w-full">
          <AccordionItem value="audio-source">
            <AccordionTrigger className="px-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" /> Audio Source
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
              <RadioGroup value={audioSource} onValueChange={(value: 'mic' | 'file') => onAudioSourceChange(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mic" id="mic" />
                  <Label htmlFor="mic">Microphone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file" />
                  <Label htmlFor="file">Audio File</Label>
                </div>
              </RadioGroup>
              {audioSource === 'mic' && (
                <Button onClick={() => onPlayToggle(!isPlaying)} className="w-full">
                  {isPlaying ? 'Stop Listening' : 'Start Listening'}
                </Button>
              )}
              {audioSource === 'file' && (
                <Input type="file" accept="audio/mp3, audio/wav, audio/ogg" onChange={handleFileSelect} />
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="shader-generator">
            <AccordionTrigger className="px-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> AI Shader Generator
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <ShaderGeneratorForm onShaderGenerated={onShaderGenerated} />
              <p className="mt-4 text-sm text-muted-foreground">{shaderDescription}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="visual-controls">
            <AccordionTrigger className="px-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" /> Visual Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="color1">Color 1</Label>
                <Input id="color1" type="color" value={params.color1} onChange={(e) => onParamChange({ color1: e.target.value })} className="p-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color2">Color 2</Label>
                <Input id="color2" type="color" value={params.color2} onChange={(e) => onParamChange({ color2: e.target.value })} className="p-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed">Speed: {params.speed.toFixed(2)}</Label>
                <Slider id="speed" min={0} max={2} step={0.05} value={[params.speed]} onValueChange={([val]) => onParamChange({ speed: val })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity: {params.intensity.toFixed(2)}</Label>
                <Slider id="intensity" min={0} max={3} step={0.1} value={[params.intensity]} onValueChange={([val]) => onParamChange({ intensity: val })} />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="export">
            <AccordionTrigger className="px-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" /> Export
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <Button onClick={() => onRecordToggle(!isRecording)} className="w-full" variant={isRecording ? 'destructive' : 'default'}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
               <p className="mt-2 text-sm text-muted-foreground">Export your visualization as a high-quality MP4 video.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <Separator className="mb-4" />
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <a href="https://github.com/firebase/studio-extra-sauce" target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </Button>
      </SidebarFooter>
    </div>
  );
}
