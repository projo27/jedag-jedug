"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateShaderAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  mood: z.string().min(2, { message: "Mood must be at least 2 characters." }),
  style: z.string().min(2, { message: "Style must be at least 2 characters." }),
  complexity: z.string(),
});

type ShaderGeneratorFormProps = {
  onShaderGenerated: (shaderCode: string, description: string) => void;
};

export function ShaderGeneratorForm({ onShaderGenerated }: ShaderGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: "energetic",
      style: "geometric",
      complexity: "intricate",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    const result = await generateShaderAction(values);
    setIsGenerating(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Shader Generation Failed",
        description: result.error,
      });
    } else {
      onShaderGenerated(result.shaderCode, result.description);
      toast({
        title: "Shader Generated!",
        description: "Your new visual experience is ready.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mood</FormLabel>
              <FormControl>
                <Input placeholder="e.g., calm, mysterious" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style</FormLabel>
              <FormControl>
                <Input placeholder="e.g., abstract, organic" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="complexity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complexity</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="intricate">Intricate</SelectItem>
                  <SelectItem value="chaotic">Chaotic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isGenerating ? 'Generating...' : 'Generate Shader'}
        </Button>
      </form>
    </Form>
  );
}
