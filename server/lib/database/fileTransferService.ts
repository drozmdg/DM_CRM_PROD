/**
 * File Transfer Service - Handles process file transfer configurations
 */

import { supabase } from '../supabase.js';

export interface ProcessFileTransfer {
  id: string;
  processId: string;
  direction: 'inbound' | 'outbound';
  connectionType: 'SFTP' | 'ADLS' | 'S3' | 'FTP' | 'HTTP' | 'Local';
  connectionConfig: Record<string, any>;
  filePattern?: string;
  sourcePath: string;
  destinationPath?: string;
  scheduleType: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  scheduleConfig: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class FileTransferService {
  
  async getFileTransfersByProcessId(processId: string): Promise<ProcessFileTransfer[]> {
    try {
      const { data: transfers, error } = await supabase
        .from('process_file_transfers')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (transfers || []).map(this.transformFileTransferRow);
    } catch (error) {
      console.error('Error fetching file transfers:', error);
      throw error;
    }
  }

  async getFileTransferById(id: string): Promise<ProcessFileTransfer | null> {
    try {
      const { data: transfer, error } = await supabase
        .from('process_file_transfers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!transfer) return null;

      return this.transformFileTransferRow(transfer);
    } catch (error) {
      console.error('Error fetching file transfer:', error);
      throw error;
    }
  }

  async createFileTransfer(
    processId: string, 
    transferData: Omit<ProcessFileTransfer, 'id' | 'processId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProcessFileTransfer> {
    try {
      const { data: transfer, error } = await supabase
        .from('process_file_transfers')
        .insert({
          process_id: processId,
          direction: transferData.direction,
          connection_type: transferData.connectionType,
          connection_config: transferData.connectionConfig || {},
          file_pattern: transferData.filePattern || null,
          source_path: transferData.sourcePath,
          destination_path: transferData.destinationPath || null,
          schedule_type: transferData.scheduleType,
          schedule_config: transferData.scheduleConfig || {},
          is_active: transferData.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformFileTransferRow(transfer);
    } catch (error) {
      console.error('Error creating file transfer:', error);
      throw error;
    }
  }

  async updateFileTransfer(
    id: string, 
    updates: Partial<ProcessFileTransfer>
  ): Promise<ProcessFileTransfer> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.direction !== undefined) updateData.direction = updates.direction;
      if (updates.connectionType !== undefined) updateData.connection_type = updates.connectionType;
      if (updates.connectionConfig !== undefined) updateData.connection_config = updates.connectionConfig;
      if (updates.filePattern !== undefined) updateData.file_pattern = updates.filePattern;
      if (updates.sourcePath !== undefined) updateData.source_path = updates.sourcePath;
      if (updates.destinationPath !== undefined) updateData.destination_path = updates.destinationPath;
      if (updates.scheduleType !== undefined) updateData.schedule_type = updates.scheduleType;
      if (updates.scheduleConfig !== undefined) updateData.schedule_config = updates.scheduleConfig;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data: transfer, error } = await supabase
        .from('process_file_transfers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.transformFileTransferRow(transfer);
    } catch (error) {
      console.error('Error updating file transfer:', error);
      throw error;
    }
  }

  async deleteFileTransfer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('process_file_transfers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file transfer:', error);
      throw error;
    }
  }

  async getActiveTransfersByType(connectionType: string): Promise<ProcessFileTransfer[]> {
    try {
      const { data: transfers, error } = await supabase
        .from('process_file_transfers')
        .select('*')
        .eq('connection_type', connectionType)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (transfers || []).map(this.transformFileTransferRow);
    } catch (error) {
      console.error('Error fetching active transfers by type:', error);
      throw error;
    }
  }

  private transformFileTransferRow(row: any): ProcessFileTransfer {
    return {
      id: row.id,
      processId: row.process_id,
      direction: row.direction,
      connectionType: row.connection_type,
      connectionConfig: row.connection_config || {},
      filePattern: row.file_pattern || undefined,
      sourcePath: row.source_path,
      destinationPath: row.destination_path || undefined,
      scheduleType: row.schedule_type,
      scheduleConfig: row.schedule_config || {},
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Helper method to validate connection config based on type
  validateConnectionConfig(connectionType: string, config: Record<string, any>): boolean {
    switch (connectionType) {
      case 'SFTP':
        return !!(config.host && config.username);
      case 'S3':
        return !!(config.bucketName && config.region);
      case 'ADLS':
        return !!(config.accountName && config.containerName);
      case 'FTP':
        return !!(config.host);
      case 'HTTP':
        return !!(config.url);
      case 'Local':
        return true; // Local paths are validated in sourcePath
      default:
        return false;
    }
  }

  // Helper method to mask sensitive information in config for logging/display
  maskConnectionConfig(config: Record<string, any>): Record<string, any> {
    const masked = { ...config };
    const sensitiveKeys = ['password', 'passwordRef', 'accessKey', 'secretKey', 'sasToken', 'token'];
    
    sensitiveKeys.forEach(key => {
      if (masked[key]) {
        masked[key] = '***masked***';
      }
    });

    return masked;
  }
}

export const fileTransferService = new FileTransferService();