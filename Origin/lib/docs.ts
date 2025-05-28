/**
 * Documentation utilities for DM_CRM
 *
 * This file contains utilities for loading and managing documentation files.
 */

import { getDocumentContentById } from '@/docs/content';

// Define the structure for documentation files
export interface DocFile {
  id: string;
  name: string;
  path: string;
  category?: string;
}

// List of all documentation files
export const docFiles: DocFile[] = [
  // Overview
  { id: 'readme', name: 'Documentation Overview', path: '/docs/README.md', category: 'Overview' },
  { id: 'implementation', name: 'Implementation Guide', path: '/IMPLEMENTATION.md', category: 'Overview' },
  { id: 'migration', name: 'Migration Strategy', path: '/docs/Migration_Strategy.md', category: 'Overview' },
  { id: 'data-migration', name: 'Data Migration', path: '/docs/DATA_MIGRATION.md', category: 'Overview' },
  { id: 'data-migration-test-plan', name: 'Data Migration Test Plan', path: '/docs/DATA_MIGRATION_TEST_PLAN.md', category: 'Overview' },
  { id: 'migration-results', name: 'Migration Results', path: '/docs/MIGRATION_RESULTS.md', category: 'Overview' },

  // Core Modules
  { id: 'customer', name: 'Customer Management', path: '/docs/CUSTOMER_MANAGEMENT.md', category: 'Core Modules' },
  { id: 'team', name: 'Team Management', path: '/docs/TEAM_MANAGEMENT.md', category: 'Core Modules' },
  { id: 'service', name: 'Service Management', path: '/docs/SERVICE_MANAGEMENT.md', category: 'Core Modules' },
  { id: 'process', name: 'Process Management', path: '/docs/PROCESS_MANAGEMENT.md', category: 'Core Modules' },
  { id: 'process-contact-and-output-delivery', name: 'Process Contact and Output Delivery', path: '/docs/PROCESS_CONTACT_AND_OUTPUT_DELIVERY.md', category: 'Core Modules' },
  { id: 'team-selection-fix', name: 'Team Selection Fix', path: '/docs/TEAM_SELECTION_FIX.md', category: 'Core Modules' },
  { id: 'multi-form-implementation', name: 'Multi-Form Implementation', path: '/docs/MULTI_FORM_IMPLEMENTATION.md', category: 'Core Modules' },
  { id: 'contact', name: 'Contact Management', path: '/docs/CONTACT_MANAGEMENT.md', category: 'Core Modules' },
  { id: 'document', name: 'Document Management', path: '/docs/DOCUMENT_MANAGEMENT.md', category: 'Core Modules' },

  // Components
  { id: 'timeline', name: 'Timeline Visualization', path: '/docs/TIMELINE_VISUALIZATION.md', category: 'Components' },
  { id: 'avatar', name: 'Customer Avatar', path: '/docs/CUSTOMER_AVATAR.md', category: 'Components' },
  { id: 'ai-chat', name: 'AI Chat', path: '/docs/AI_CHAT.md', category: 'Components' },

  // Data
  { id: 'data-model', name: 'Data Model', path: '/docs/DATA_MODEL.md', category: 'Data' },
  { id: 'database-schema', name: 'Database Schema', path: '/docs/DATABASE_SCHEMA.md', category: 'Data' },
  { id: 'entity-relationships', name: 'Entity Relationships', path: '/docs/ENTITY_RELATIONSHIPS.md', category: 'Data' },
  { id: 'data-schema', name: 'Data Schema', path: '/docs/DATA_SCHEMA.md', category: 'Data' },

  // UI
  { id: 'styling', name: 'Styling System', path: '/docs/STYLING_SYSTEM.md', category: 'UI' },
  { id: 'badge', name: 'Badge Components', path: '/docs/BADGE_COMPONENTS.md', category: 'UI' },
  { id: 'screen-assets', name: 'Screen Assets', path: '/docs/SCREEN_ASSETS.md', category: 'UI' },

  // Supabase Integration
  { id: 'supabase-permission-fix', name: 'Supabase Permission Fix', path: '/docs/SUPABASE_PERMISSION_FIX.md', category: 'Supabase Integration' },
  { id: 'supabase-data-structure-fix', name: 'Supabase Data Structure Fix', path: '/docs/SUPABASE_DATA_STRUCTURE_FIX.md', category: 'Supabase Integration' },
  { id: 'database-admin', name: 'Database Administration', path: '/docs/DATABASE_ADMIN.md', category: 'Supabase Integration' },

  // Ollama Integration
  { id: 'ollama-implementation-review', name: 'Ollama Implementation Review', path: '/docs/Ollama_Implementation_Review_Plan.md', category: 'Ollama Integration' },
  { id: 'ai-system-prompt', name: 'AI System Prompt', path: '/docs/AI_SYSTEM_PROMPT.MD', category: 'Ollama Integration' },

  // Refactoring Documentation
  { id: 'refactoring', name: 'Refactoring Documentation', path: '/docs/refactoring/README.md', category: 'Refactoring' },

  // Development Tracking
  { id: 'pending-features', name: 'Pending Features and Issues', path: '/docs/PENDING_FEATURES_AND_ISSUES.md', category: 'Development Tracking' },
];

/**
 * Load a documentation file
 * @param filePath Path to the documentation file
 * @param docId Optional document ID to load content from the imported modules
 * @returns Promise that resolves to the file content
 */
export const loadDocFile = async (filePath: string, docId?: string): Promise<string> => {
  try {
    // First, try to get the content from the imported modules
    if (docId) {
      const importedContent = getDocumentContentById(docId);
      if (importedContent) {
        return importedContent;
      }
    }

    // If not found in imported modules, try to fetch from the file system
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load documentation file: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error loading documentation file:', error);

    // Return a fallback message instead of throwing an error
    return `# Documentation File Not Found

The documentation file at \`${filePath}\` could not be loaded.

This could be due to one of the following reasons:
- The file does not exist
- The file is not accessible
- There was a network error

Please check the file path and try again.`;
  }
};

/**
 * Get a documentation file by ID
 * @param id ID of the documentation file
 * @returns The documentation file or undefined if not found
 */
export const getDocFileById = (id: string): DocFile | undefined => {
  return docFiles.find(file => file.id === id);
};

/**
 * Group documentation files by category
 * @returns Record of categories with their files
 */
export const getGroupedDocFiles = (): Record<string, DocFile[]> => {
  return docFiles.reduce((acc, file) => {
    const category = file.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, DocFile[]>);
};

/**
 * Get sorted category names
 * @returns Array of sorted category names
 */
export const getSortedCategories = (): string[] => {
  const groupedFiles = getGroupedDocFiles();
  return Object.keys(groupedFiles).sort((a, b) => {
    // Custom sort order
    const order = [
      'Overview',
      'Core Modules',
      'Components',
      'Data',
      'UI',
      'Supabase Integration',
      'Ollama Integration',
      'Development Tracking',
      'Refactoring',
      'Uncategorized'
    ];
    return order.indexOf(a) - order.indexOf(b);
  });
};
