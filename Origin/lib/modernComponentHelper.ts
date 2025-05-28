// Modern Component Integration Helper
// This helper provides utilities for safely migrating from pixel components to modern components

import { featureFlagManager } from '../config/featureFlags';
import { cn } from '../lib/utils';

// Component variant mapping for migration
interface ComponentVariants {
  pixel: string;
  modern: string;
}

// Button variant mappings
export const buttonVariants: Record<string, ComponentVariants> = {
  primary: {
    pixel: 'pixel-button bg-primary hover:bg-primary/90',
    modern: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  secondary: {
    pixel: 'pixel-button bg-secondary hover:bg-secondary/90',
    modern: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
  },
  destructive: {
    pixel: 'pixel-button bg-destructive hover:bg-destructive/90',
    modern: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
};

// Card variant mappings
export const cardVariants: Record<string, ComponentVariants> = {
  default: {
    pixel: 'pixel-card bg-card border-2 border-border',
    modern: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
  },
  hover: {
    pixel: 'pixel-card bg-card border-2 border-border hover:border-primary',
    modern: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow',
  },
};

// Badge variant mappings
export const badgeVariants: Record<string, ComponentVariants> = {
  default: {
    pixel: 'pixel-borders bg-primary text-primary-foreground text-sm px-2 py-1',
    modern: 'bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium',
  },
  secondary: {
    pixel: 'pixel-borders bg-secondary text-secondary-foreground text-sm px-2 py-1',
    modern: 'bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md font-medium',
  },
  success: {
    pixel: 'pixel-borders bg-green-500 text-white text-sm px-2 py-1',
    modern: 'bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium',
  },
  warning: {
    pixel: 'pixel-borders bg-yellow-500 text-black text-sm px-2 py-1',
    modern: 'bg-yellow-500 text-yellow-50 text-xs px-2 py-1 rounded-md font-medium',
  },
  destructive: {
    pixel: 'pixel-borders bg-destructive text-destructive-foreground text-sm px-2 py-1',
    modern: 'bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-medium',
  },
};

// Input variant mappings
export const inputVariants: Record<string, ComponentVariants> = {
  default: {
    pixel: 'pixel-input border-2 border-border bg-background',
    modern: 'border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
  },
};

/**
 * Get appropriate component classes based on feature flags
 */
export function getComponentClasses(
  componentType: 'button' | 'card' | 'badge' | 'input',
  variant: string = 'default',
  additionalClasses?: string
): string {
  const flags = featureFlagManager.getFlags();
  
  let variantMap: Record<string, ComponentVariants> = {};
  
  switch (componentType) {
    case 'button':
      variantMap = buttonVariants;
      break;
    case 'card':
      variantMap = cardVariants;
      break;
    case 'badge':
      variantMap = badgeVariants;
      break;
    case 'input':
      variantMap = inputVariants;
      break;
  }
  
  const variantConfig = variantMap[variant] || variantMap.default;
  const baseClasses = flags.useModernComponents ? variantConfig.modern : variantConfig.pixel;
  
  return cn(baseClasses, additionalClasses);
}

/**
 * Conditional component wrapper for safe migration
 */
export function withModernFallback<T extends React.ComponentProps<any>>(
  ModernComponent: React.ComponentType<T>,
  PixelComponent: React.ComponentType<T>
) {
  return function ConditionalComponent(props: T) {
    const flags = featureFlagManager.getFlags();
    
    if (flags.useModernComponents) {
      return React.createElement(ModernComponent, props);
    }
    
    return React.createElement(PixelComponent, props);
  };
}

/**
 * Animation class selector based on feature flags
 */
export function getAnimationClasses(pixelAnimation: string, modernAnimation: string): string {
  const flags = featureFlagManager.getFlags();
  
  if (flags.useModernAnimations) {
    return modernAnimation;
  }
  
  return pixelAnimation;
}

/**
 * Color class selector based on feature flags
 */
export function getColorClasses(pixelColor: string, modernColor: string): string {
  const flags = featureFlagManager.getFlags();
  
  if (flags.useModernColors) {
    return modernColor;
  }
  
  return pixelColor;
}

/**
 * Typography class selector based on feature flags
 */
export function getTypographyClasses(pixelTypography: string, modernTypography: string): string {
  const flags = featureFlagManager.getFlags();
  
  if (flags.useModernTypography) {
    return modernTypography;
  }
  
  return pixelTypography;
}

// Import React for component creation
import React from 'react';
