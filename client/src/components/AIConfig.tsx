import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { 
  getOllamaConfig, 
  updateOllamaConfig, 
  fetchAvailableModels,
  type OllamaConfig,
  type OllamaModelInfo
} from "@/lib/ai-chat";

interface AIConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIConfig({ open, onOpenChange }: AIConfigProps) {
  const [config, setConfig] = useState<OllamaConfig>({
    endpoint: "http://localhost:11434/api/generate",
    model: "llama2",
    temperature: 0.7,
    maxTokens: 500,
    useSystemPrompt: true,
  });
  const [availableModels, setAvailableModels] = useState<OllamaModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const { toast } = useToast();

  // Load configuration when dialog opens
  useEffect(() => {
    if (open) {
      const currentConfig = getOllamaConfig();
      setConfig(currentConfig);
      loadAvailableModels(currentConfig.endpoint);
    }
  }, [open]);

  // Function to load available models
  const loadAvailableModels = async (endpoint?: string) => {
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels(endpoint || config.endpoint);
      setAvailableModels(models);
      setConnectionStatus(models.length > 0 ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error loading models:', error);
      setConnectionStatus('disconnected');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };
  const handleSave = () => {
    try {
      // Update the configuration using the AI chat library
      updateOllamaConfig(config);
      
      toast({
        title: "Configuration updated",
        description: "AI settings have been saved successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save AI configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpoint" className="text-right">
              API Endpoint
            </Label>
            <Input
              id="endpoint"
              className="col-span-3"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
              Model
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select
                value={config.model}
                onValueChange={(value) => setConfig({ ...config, model: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingModels ? (
                    <SelectItem value="loading">Loading models...</SelectItem>
                  ) : (
                    <>
                      {availableModels?.length > 0 ? (
                        availableModels.map((model: OllamaModelInfo) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="llama2">llama2 (default)</SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadAvailableModels()}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3 flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected to Ollama</span>
                </>
              )}
              {connectionStatus === 'disconnected' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Cannot connect to Ollama</span>
                </>
              )}
              {connectionStatus === 'unknown' && (
                <span className="text-sm text-muted-foreground">Status unknown</span>
              )}
            </div>
          </div>

          {connectionStatus === 'disconnected' && (
            <div className="col-span-4 bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Cannot connect to Ollama server. Make sure Ollama is running with:
              </p>
              <code className="block mt-1 text-xs bg-red-100 p-1 rounded">ollama serve</code>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature" className="text-right">
              Temperature: {config.temperature?.toFixed(1)}
            </Label>
            <div className="col-span-3">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[config.temperature || 0.7]}
                onValueChange={(values) => setConfig({ ...config, temperature: values[0] })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxTokens" className="text-right">
              Max Tokens
            </Label>
            <Input
              id="maxTokens"
              type="number"
              className="col-span-3"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="useSystemPrompt" className="text-right">
              Use System Prompt
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="useSystemPrompt"
                checked={config.useSystemPrompt}
                onCheckedChange={(checked) => setConfig({ ...config, useSystemPrompt: checked })}
              />
              <span className="text-sm text-muted-foreground">
                {config.useSystemPrompt
                  ? "Enabled (provides CRM context to AI)"
                  : "Disabled (generic responses)"}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
