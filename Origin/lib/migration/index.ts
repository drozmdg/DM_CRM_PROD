/**
 * Migration Utilities Index
 * 
 * This file re-exports all migration utilities for easier imports.
 */

// Export types
export * from './types';

// Export utility functions
export * from './utils';

// Export customer migration functions
export * from './customer-migration';

// Export chat migration functions
export * from './chat-migration';

// Import dependencies
import { MigrationStatus } from './types';
import { migrateCustomerData } from './customer-migration';
import { migrateChatSessions, migrateOllamaConfig } from './chat-migration';

/**
 * Migrate all data from localStorage to Supabase
 * @returns Promise that resolves to a MigrationStatus object
 */
export const migrateAllData = async (): Promise<MigrationStatus> => {
  try {
    // Migrate customer data
    const customerMigration = await migrateCustomerData();

    // Migrate chat sessions
    const chatMigration = await migrateChatSessions();

    // Migrate Ollama config
    const ollamaMigration = await migrateOllamaConfig();

    // Check if all migrations were successful
    if (customerMigration.success && chatMigration.success && ollamaMigration.success) {
      return {
        success: true,
        message: 'All data migrated successfully',
        details: {
          ...customerMigration.details,
          ...chatMigration.details
        }
      };
    } else {
      // Collect error messages
      const errorMessages = [];

      if (!customerMigration.success) {
        errorMessages.push(`Customer data: ${customerMigration.message}`);
      }

      if (!chatMigration.success) {
        errorMessages.push(`Chat sessions: ${chatMigration.message}`);
      }

      if (!ollamaMigration.success) {
        errorMessages.push(`Ollama config: ${ollamaMigration.message}`);
      }

      return {
        success: false,
        message: `Migration partially completed with errors: ${errorMessages.join(', ')}`,
        details: {
          ...customerMigration.details,
          ...chatMigration.details
        }
      };
    }
  } catch (error) {
    console.error('Error migrating all data:', error);
    return {
      success: false,
      message: 'Error migrating all data',
      error
    };
  }
};
