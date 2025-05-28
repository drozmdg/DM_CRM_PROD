import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import PixelButton from '@/legacy/components/pixel/PixelButton';
import { ModernButton } from '@/components/ui/modern';
import { useFeatureFlags } from '@/config/featureFlags';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  getOllamaConfig,
  updateOllamaConfig
} from '@/lib/ai-chat/config';
import {
  fetchAvailableModels
} from '@/lib/ai-chat/api';
import { OllamaModelInfo } from '@/lib/ai-chat/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormValues {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  useSystemPrompt: boolean;
}

const ChatConfig: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [flags] = useFeatureFlags();
  const [availableModels, setAvailableModels] = useState<OllamaModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  // Get the current Ollama configuration
  const currentConfig = getOllamaConfig();

  const form = useForm<FormValues>({
    defaultValues: {
      endpoint: currentConfig.endpoint,
      model: currentConfig.model,
      temperature: currentConfig.temperature || 0.7,
      maxTokens: currentConfig.maxTokens || 500,
      useSystemPrompt: currentConfig.useSystemPrompt !== undefined ? currentConfig.useSystemPrompt : true
    }
  });

  // Function to fetch available models
  const loadAvailableModels = async (endpoint?: string) => {
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels(endpoint || form.getValues().endpoint);
      setAvailableModels(models);
      setConnectionStatus(models.length > 0 ? 'connected' : 'disconnected');
      return models;
    } catch (error) {
      console.error('Error loading models:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to connect to Ollama server');
      return [];
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load current config and available models when dialog opens
  useEffect(() => {
    if (open) {
      const config = getOllamaConfig();

      // Important: We need to set the values directly to ensure they're properly updated
      form.setValue('endpoint', config.endpoint);
      form.setValue('model', config.model);
      form.setValue('temperature', config.temperature || 0.7);
      form.setValue('maxTokens', config.maxTokens || 500);
      form.setValue('useSystemPrompt', config.useSystemPrompt !== undefined ? config.useSystemPrompt : true);

      // Load available models
      loadAvailableModels(config.endpoint);
    }
  }, [open, form]);

  const onSubmit = (data: FormValues) => {
    try {
      // Ensure numeric values are properly converted
      const temperature = typeof data.temperature === 'string'
        ? parseFloat(data.temperature)
        : data.temperature;

      const maxTokens = typeof data.maxTokens === 'string'
        ? parseInt(data.maxTokens, 10)
        : data.maxTokens;

      // Update the configuration
      updateOllamaConfig({
        endpoint: data.endpoint,
        model: data.model,
        temperature: temperature,
        maxTokens: maxTokens,
        useSystemPrompt: data.useSystemPrompt
      });

      toast.success('Ollama configuration updated and saved');
      setOpen(false);
    } catch (error) {
      console.error('Error updating Ollama config:', error);
      toast.error('Failed to update configuration');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full flex items-center justify-between px-4 py-2 text-sm bg-muted border-2 border-primary text-foreground hover:bg-muted/80 rounded cursor-pointer">
          <span>Configure AI Settings</span>
          <Settings size={14} />
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-card border-2 border-border text-card-foreground" aria-describedby="ollama-config-description">
        <DialogHeader>
          <DialogTitle className="text-white">Ollama Configuration</DialogTitle>
          <p id="ollama-config-description" className="text-sm text-gray-400">
            Configure your local Ollama instance settings
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-card border-border text-card-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Model Name</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <SelectTrigger className="bg-card border-border text-card-foreground">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-card-foreground">
                              {availableModels.length > 0 ? (
                                availableModels.map((model) => (
                                  <SelectItem key={model.name} value={model.name}>
                                    {model.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="llama2" disabled>
                                  No models available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {connectionStatus === 'connected' && (
                          <span className="text-green-500 flex items-center">
                            <Check size={16} className="mr-1" />
                          </span>
                        )}
                        {connectionStatus === 'disconnected' && (
                          <span className="text-red-500 flex items-center">
                            <AlertCircle size={16} className="mr-1" />
                          </span>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {flags.useModernComponents ? (
                <ModernButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadAvailableModels()}
                  disabled={isLoadingModels}
                  className="mb-1"
                >
                  {isLoadingModels ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                </ModernButton>
              ) : (
                <PixelButton
                  type="button"
                  variant="secondary"
                  onClick={() => loadAvailableModels()}
                  disabled={isLoadingModels}
                  className="mb-1 text-sm"
                >
                  {isLoadingModels ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                </PixelButton>
              )}
            </div>

            {connectionStatus === 'disconnected' && (
              <div className="bg-red-900/30 border border-red-500 p-2 rounded text-xs text-red-300">
                <p className="flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  Cannot connect to Ollama server. Make sure Ollama is running with:
                </p>
                <code className="block mt-1 bg-black/30 p-1 rounded">ollama serve</code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Temperature</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        className="bg-card border-border text-card-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Max Tokens</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="10"
                        max="4096"
                        className="bg-card border-border text-card-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="useSystemPrompt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-white">
                      Use CRM Data Context
                    </FormLabel>
                    <FormDescription className="text-gray-400">
                      Enable to give the AI access to your CRM data summary
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              {flags.useModernComponents ? (
                <ModernButton
                  type="submit"
                  variant="primary"
                  className="flex items-center gap-1"
                >
                  <Save size={14} />
                  Save Configuration
                </ModernButton>
              ) : (
                <PixelButton
                  type="submit"
                  variant="primary"
                  className="flex items-center gap-1"
                >
                  <Save size={14} />
                  Save Configuration
                </PixelButton>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatConfig;
