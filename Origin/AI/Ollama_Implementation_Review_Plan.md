# Ollama Implementation Review Plan

## Problem Statement
The current implementation stores Ollama configuration settings in localStorage, which doesn't persist across different devices. When accessing RETRO_CRM from different devices (like an iPad), the settings revert to defaults.

## Solution Approach
We'll implement a server-side storage solution for Ollama settings using Supabase, which will allow settings to be synchronized across devices. This aligns with the migration strategy to use hosted Supabase.

## Implementation Steps

### 1. Create Supabase Table for Ollama Configuration

First, we'll need to create a table in Supabase to store the Ollama configuration.

```sql
CREATE TABLE ollama_config (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature FLOAT NOT NULL,
  max_tokens INTEGER NOT NULL,
  use_system_prompt BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO ollama_config (endpoint, model, temperature, max_tokens, use_system_prompt)
VALUES ('http://localhost:11434/api/generate', 'llama2', 0.7, 500, TRUE);
```

### 2. Create Supabase Client Configuration

We'll create a Supabase client configuration file to connect to the hosted Supabase instance.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. Update AI Chat Library to Use Supabase

We'll modify the `ai-chat.ts` file to use Supabase for configuration storage.

```typescript
// src/lib/ai-chat.ts (modified)
import { supabase } from './supabase';

// Configuration for Ollama
interface OllamaConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  useSystemPrompt?: boolean;
}

// Default Ollama configuration
const defaultOllamaConfig: OllamaConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama2',
  temperature: 0.7,
  maxTokens: 500,
  useSystemPrompt: true
};

// Current configuration - can be updated at runtime
let ollamaConfig: OllamaConfig = { ...defaultOllamaConfig };

// Load configuration from Supabase
export const loadSavedConfig = async (): Promise<OllamaConfig> => {
  try {
    // First try to load from Supabase
    const { data, error } = await supabase
      .from('ollama_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error loading Ollama config from Supabase:', error);
      
      // Fall back to localStorage if Supabase fails
      const savedConfig = localStorage.getItem('retro_crm_ollama_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        console.log('Loaded Ollama config from localStorage:', parsedConfig);
        return { ...defaultOllamaConfig, ...parsedConfig };
      }
    } else if (data) {
      // Transform Supabase data to match our config format
      const config: OllamaConfig = {
        endpoint: data.endpoint,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.max_tokens,
        useSystemPrompt: data.use_system_prompt
      };
      
      console.log('Loaded Ollama config from Supabase:', config);
      
      // Update localStorage for offline use
      localStorage.setItem('retro_crm_ollama_config', JSON.stringify(config));
      
      return config;
    }
  } catch (error) {
    console.error('Error loading Ollama config:', error);
  }
  
  return { ...defaultOllamaConfig };
};

// Initialize config on module load
(async () => {
  ollamaConfig = await loadSavedConfig();
})();

/**
 * Update the Ollama configuration
 * @param config New configuration options
 */
export const updateOllamaConfig = async (config: Partial<OllamaConfig>): Promise<void> => {
  // Update the runtime configuration
  ollamaConfig = { ...ollamaConfig, ...config };

  try {
    // Save to Supabase
    const { error } = await supabase
      .from('ollama_config')
      .upsert({
        id: 1, // Always update the first record
        endpoint: ollamaConfig.endpoint,
        model: ollamaConfig.model,
        temperature: ollamaConfig.temperature,
        max_tokens: ollamaConfig.maxTokens,
        use_system_prompt: ollamaConfig.useSystemPrompt,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving Ollama config to Supabase:', error);
      throw error;
    }
    
    // Also save to localStorage for offline use
    localStorage.setItem('retro_crm_ollama_config', JSON.stringify(ollamaConfig));
    console.log('Saved Ollama config to Supabase and localStorage:', ollamaConfig);
  } catch (error) {
    console.error('Error saving Ollama config:', error);
    
    // Fall back to localStorage only
    localStorage.setItem('retro_crm_ollama_config', JSON.stringify(ollamaConfig));
    throw error;
  }
};

/**
 * Get the current Ollama configuration
 * @returns The current Ollama configuration
 */
export const getOllamaConfig = (): OllamaConfig => {
  return { ...ollamaConfig };
};
```

### 4. Update ChatConfig Component to Handle Asynchronous Operations

We'll modify the ChatConfig component to handle the asynchronous nature of Supabase operations.

```typescript
// Key changes to src/components/Chat/ChatConfig.tsx
// Add loading state for saving
const [isSaving, setIsSaving] = useState(false);

// Load current config and available models when dialog opens
useEffect(() => {
  if (open) {
    // Load the latest config from Supabase
    const loadConfig = async () => {
      const config = await loadSavedConfig();
      
      // Important: We need to set the values directly to ensure they're properly updated
      form.setValue('endpoint', config.endpoint);
      form.setValue('model', config.model);
      form.setValue('temperature', config.temperature || 0.7);
      form.setValue('maxTokens', config.maxTokens || 500);
      form.setValue('useSystemPrompt', config.useSystemPrompt !== undefined ? config.useSystemPrompt : true);
      
      // Load available models
      loadAvailableModels(config.endpoint);
    };
    
    loadConfig();
  }
}, [open, form]);

// Update onSubmit to be async
const onSubmit = async (data: FormValues) => {
  setIsSaving(true);
  try {
    // Ensure numeric values are properly converted
    const temperature = typeof data.temperature === 'string'
      ? parseFloat(data.temperature)
      : data.temperature;

    const maxTokens = typeof data.maxTokens === 'string'
      ? parseInt(data.maxTokens, 10)
      : data.maxTokens;

    // Update the configuration
    await updateOllamaConfig({
      endpoint: data.endpoint,
      model: data.model,
      temperature: temperature,
      maxTokens: maxTokens,
      useSystemPrompt: data.useSystemPrompt
    });

    toast.success('Ollama configuration updated and saved to cloud');
    setOpen(false);
  } catch (error) {
    console.error('Error updating Ollama config:', error);
    toast.error('Failed to update configuration');
  } finally {
    setIsSaving(false);
  }
};

// Update submit button to show loading state
<PixelButton
  type="submit"
  variant="primary"
  className="flex items-center gap-1"
  disabled={isSaving}
>
  {isSaving ? (
    <>
      <Loader2 size={14} className="animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save size={14} />
      Save Configuration
    </>
  )}
</PixelButton>
```

### 5. Add Environment Variables

We'll need to add environment variables for Supabase connection.

```
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Update Package.json

Add Supabase client library to the project.

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

### 7. Create a Migration Script

Create a script to migrate existing localStorage settings to Supabase.

```typescript
// scripts/migrate-ollama-config.ts
import { supabase } from '../src/lib/supabase';

const migrateOllamaConfig = async () => {
  try {
    // Check if we have config in localStorage
    const savedConfig = localStorage.getItem('retro_crm_ollama_config');
    if (!savedConfig) {
      console.log('No Ollama config found in localStorage');
      return;
    }

    const parsedConfig = JSON.parse(savedConfig);
    console.log('Found Ollama config in localStorage:', parsedConfig);

    // Save to Supabase
    const { data, error } = await supabase
      .from('ollama_config')
      .upsert({
        id: 1,
        endpoint: parsedConfig.endpoint || 'http://localhost:11434/api/generate',
        model: parsedConfig.model || 'llama2',
        temperature: parsedConfig.temperature || 0.7,
        max_tokens: parsedConfig.maxTokens || 500,
        use_system_prompt: parsedConfig.useSystemPrompt !== undefined ? parsedConfig.useSystemPrompt : true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error migrating Ollama config to Supabase:', error);
    } else {
      console.log('Successfully migrated Ollama config to Supabase');
    }
  } catch (error) {
    console.error('Error in migration script:', error);
  }
};

// Run the migration
migrateOllamaConfig();
```

### 8. Add Status Indicator for Cloud Sync

Add a visual indicator to show when settings are synced to the cloud.

```typescript
// Add to ChatConfig.tsx
const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

// Update in onSubmit function
setSyncStatus('syncing');
await updateOllamaConfig({...});
setSyncStatus('synced');

// Add to UI
<div className="text-xs flex items-center mt-2">
  {syncStatus === 'synced' && (
    <>
      <Check size={12} className="text-green-500 mr-1" />
      <span className="text-green-500">Settings synced to cloud</span>
    </>
  )}
  {syncStatus === 'syncing' && (
    <>
      <Loader2 size={12} className="animate-spin text-yellow-500 mr-1" />
      <span className="text-yellow-500">Syncing settings...</span>
    </>
  )}
  {syncStatus === 'error' && (
    <>
      <AlertCircle size={12} className="text-red-500 mr-1" />
      <span className="text-red-500">Sync error</span>
    </>
  )}
</div>
```

## Testing Plan

1. **Unit Testing**
   - Test Supabase connection and configuration retrieval
   - Test fallback to localStorage when Supabase is unavailable
   - Test error handling in configuration updates

2. **Integration Testing**
   - Test end-to-end flow from UI to Supabase and back
   - Test configuration persistence across page refreshes
   - Test synchronization between different browser sessions

3. **Cross-Device Testing**
   - Test on desktop browser
   - Test on iPad
   - Verify settings persist between devices

## Documentation Updates

After implementing the changes, we'll update the AI_CHAT.md documentation to reflect the new cloud-based configuration storage.

```markdown
# AI Chat Documentation Update

## Configuration Persistence

All Ollama configuration settings are now stored in Supabase and automatically synchronized across devices. This ensures:

- Settings persist between different devices (desktop, iPad, etc.)
- Users don't need to reconfigure settings on each device
- The application maintains a consistent user experience across all platforms

The system uses a hybrid approach:
- Primary storage is in Supabase for cross-device synchronization
- Local storage is used as a fallback for offline operation
- Changes made on one device are automatically available on other devices

### Implementation Details

The configuration persistence is implemented using:
- Supabase for cloud storage of settings
- Asynchronous loading and saving of configuration
- Automatic synchronization between devices
- Visual indicators for sync status
- Fallback to localStorage when offline

This approach ensures a seamless experience across different devices while maintaining the application's functionality even when offline.
```

## Implementation Timeline

1. **Setup Supabase Table and Client (Day 1)**
   - Create Supabase table for Ollama configuration
   - Set up Supabase client in the application
   - Configure environment variables

2. **Update AI Chat Library (Day 1-2)**
   - Modify loadSavedConfig to use Supabase
   - Update updateOllamaConfig to save to Supabase
   - Implement fallback to localStorage

3. **Update ChatConfig Component (Day 2)**
   - Handle asynchronous operations
   - Add loading and saving indicators
   - Implement sync status display

4. **Create Migration Script (Day 2)**
   - Develop script to migrate existing settings
   - Test migration process

5. **Testing (Day 3)**
   - Perform unit and integration testing
   - Test cross-device synchronization
   - Fix any issues discovered during testing

6. **Documentation (Day 3)**
   - Update AI_CHAT.md with new information
   - Document the implementation details
   - Provide usage instructions

## Conclusion

This implementation will address the issue of AI settings not persisting across different devices by using Supabase for cloud storage of configuration settings. The hybrid approach ensures that the application works both online and offline, with seamless synchronization between devices when online.

The solution aligns with the overall migration strategy to use hosted Supabase for data storage and provides a better user experience by eliminating the need to reconfigure settings on each device.
