/**
 * Product Service - Handles all product-related database operations
 */

import { supabase } from '../supabase.js';
import type { Product, TeamProduct } from '../../../shared/types/index.js';

export class ProductService {
  
  async getAllProducts(): Promise<Product[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          team_products (
            *,
            teams (*)
          )
        `)
        .order('name');

      if (error) throw error;

      return products.map(this.transformProductRow);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          team_products (
            *,
            teams (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!product) return null;

      return this.transformProductRow(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getProductsByCustomerId(customerId: string): Promise<Product[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          team_products (
            *,
            teams (*)
          )
        `)
        .eq('customer_id', customerId)
        .order('name');

      if (error) throw error;

      return products.map(this.transformProductRow);
    } catch (error) {
      console.error('Error fetching products by customer:', error);
      throw error;
    }
  }

  async getProductsByTeamId(teamId: string): Promise<Product[]> {
    try {
      // First get the product IDs from team_products
      const { data: teamProducts, error: tpError } = await supabase
        .from('team_products')
        .select('product_id')
        .eq('team_id', teamId);

      if (tpError) throw tpError;

      if (!teamProducts || teamProducts.length === 0) {
        return [];
      }

      // Then get the full product details
      const productIds = teamProducts.map(tp => tp.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          team_products (
            *,
            teams (*)
          )
        `)
        .in('id', productIds);

      if (productsError) throw productsError;

      return (products || []).map(this.transformProductRow);
    } catch (error) {
      console.error('Error fetching products by team:', error);
      throw error;
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          customer_id: productData.customerId,
          name: productData.name,
          description: productData.description,
          code: productData.code,
          is_active: productData.isActive ?? true,
          therapeutic_area: productData.therapeuticArea,
          drug_class: productData.drugClass,
          indication: productData.indication,
          regulatory_status: productData.regulatoryStatus || 'Pre-clinical'
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformProductRow(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.therapeuticArea !== undefined) updateData.therapeutic_area = updates.therapeuticArea;
      if (updates.drugClass !== undefined) updateData.drug_class = updates.drugClass;
      if (updates.indication !== undefined) updateData.indication = updates.indication;
      if (updates.regulatoryStatus !== undefined) updateData.regulatory_status = updates.regulatoryStatus;
      
      updateData.updated_at = new Date().toISOString();

      const { data: product, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          team_products (
            *,
            teams (*)
          )
        `)
        .single();

      if (error) throw error;

      return this.transformProductRow(product);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async assignTeamToProduct(productId: string, teamId: string, isPrimary: boolean = false, responsibilityLevel: string = 'Secondary'): Promise<void> {
    try {
      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('team_products')
        .select('*')
        .eq('product_id', productId)
        .eq('team_id', teamId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        throw checkError;
      }

      if (existing) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('team_products')
          .update({ 
            is_primary: isPrimary,
            responsibility_level: responsibilityLevel
          })
          .eq('product_id', productId)
          .eq('team_id', teamId);

        if (updateError) throw updateError;
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('team_products')
          .insert({
            product_id: productId,
            team_id: teamId,
            is_primary: isPrimary,
            responsibility_level: responsibilityLevel,
            assigned_date: new Date().toISOString().split('T')[0]
          });

        if (insertError) throw insertError;
      }

      // If setting as primary, unset other teams as primary
      if (isPrimary) {
        const { error: updateOthersError } = await supabase
          .from('team_products')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .neq('team_id', teamId);

        if (updateOthersError) throw updateOthersError;
      }
    } catch (error) {
      console.error('Error assigning team to product:', error);
      throw error;
    }
  }

  async unassignTeamFromProduct(productId: string, teamId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_products')
        .delete()
        .eq('product_id', productId)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unassigning team from product:', error);
      throw error;
    }
  }

  async getProductMetrics(): Promise<{
    total: number;
    active: number;
    byCustomer: Record<string, number>;
    byTeam: Record<string, number>;
  }> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          customers!inner (
            id,
            name
          ),
          team_products (
            teams!inner (
              name
            )
          )
        `);

      if (error) throw error;

      const total = products.length;
      const active = products.filter(p => p.is_active).length;
      const byCustomer: Record<string, number> = {};
      const byTeam: Record<string, number> = {};

      products.forEach(product => {
        const customerName = (product as any).customers.name;
        byCustomer[customerName] = (byCustomer[customerName] || 0) + 1;

        // Count products by team
        if ((product as any).team_products) {
          (product as any).team_products.forEach((tp: any) => {
            const teamName = tp.teams.name;
            byTeam[teamName] = (byTeam[teamName] || 0) + 1;
          });
        }
      });

      return {
        total,
        active,
        byCustomer,
        byTeam
      };
    } catch (error) {
      console.error('Error getting product metrics:', error);
      throw error;
    }
  }

  private transformProductRow(row: any): Product {
    const product: Product = {
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      description: row.description,
      code: row.code,
      isActive: row.is_active,
      therapeuticArea: row.therapeutic_area,
      drugClass: row.drug_class,
      indication: row.indication,
      regulatoryStatus: row.regulatory_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Transform team relationships
    if (row.team_products && Array.isArray(row.team_products)) {
      product.teams = row.team_products.map((tp: any) => ({
        teamId: tp.team_id,
        productId: tp.product_id,
        assignedDate: tp.assigned_date,
        isPrimary: tp.is_primary,
        responsibilityLevel: tp.responsibility_level,
        team: tp.teams ? {
          id: tp.teams.id,
          name: tp.teams.name,
          financeCode: tp.teams.finance_code,
          startDate: tp.teams.start_date,
          endDate: tp.teams.end_date
        } : undefined
      }));
    }

    return product;
  }
}

export const productService = new ProductService();