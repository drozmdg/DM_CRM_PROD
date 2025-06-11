import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Users, 
  Lock, 
  Unlock,
  Eye,
  Edit,
  Download,
  Copy,
  Mail,
  Calendar,
  Clock,
  UserPlus,
  UserMinus,
  Shield,
  Globe,
  Building,
  Team,
  AlertCircle,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface DocumentShare {
  id: string;
  document_id: string;
  shared_with_type: 'user' | 'team' | 'customer' | 'external';
  shared_with_id?: string;
  shared_with_email?: string;
  access_level: 'view' | 'download' | 'edit';
  expires_at?: string;
  created_by: string;
  created_at: string;
  last_accessed?: string;
  access_count: number;
  is_active: boolean;
  share_token?: string;
  share_url?: string;
  user_name?: string;
  team_name?: string;
  customer_name?: string;
}

interface DocumentSharingProps {
  documentId: string;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const ACCESS_LEVELS = [
  { value: 'view', label: 'View Only', icon: Eye, description: 'Can view the document' },
  { value: 'download', label: 'View & Download', icon: Download, description: 'Can view and download the document' },
  { value: 'edit', label: 'Full Access', icon: Edit, description: 'Can view, download, and replace the document' }
] as const;

const SHARE_TYPES = [
  { value: 'user', label: 'Internal User', icon: Users, description: 'Share with someone in your organization' },
  { value: 'team', label: 'Team', icon: Team, description: 'Share with an entire team' },
  { value: 'customer', label: 'Customer', icon: Building, description: 'Share with customer contacts' },
  { value: 'external', label: 'External Email', icon: Mail, description: 'Share with external email address' }
] as const;

export default function DocumentSharing({
  documentId,
  documentName,
  isOpen,
  onClose,
  currentUserId
}: DocumentSharingProps) {
  const [shareForm, setShareForm] = useState({
    type: 'user' as 'user' | 'team' | 'customer' | 'external',
    targetId: '',
    email: '',
    accessLevel: 'view' as 'view' | 'download' | 'edit',
    expiresIn: '30', // days
    message: '',
    requirePassword: false,
    password: '',
    notifyByEmail: true
  });
  const [showShareForm, setShowShareForm] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch document shares
  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['document-shares', documentId],
    queryFn: () => apiRequest('GET', `/api/documents/${documentId}/shares`).then(res => res.json()),
    enabled: isOpen,
  });

  // Fetch users for sharing options
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest('GET', '/api/users').then(res => res.json()),
    enabled: isOpen && shareForm.type === 'user',
  });

  // Fetch teams for sharing options
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => apiRequest('GET', '/api/teams').then(res => res.json()),
    enabled: isOpen && shareForm.type === 'team',
  });

  // Fetch customers for sharing options
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiRequest('GET', '/api/customers').then(res => res.json()),
    enabled: isOpen && shareForm.type === 'customer',
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async (shareData: any) => {
      return apiRequest('POST', `/api/documents/${documentId}/shares`, shareData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-shares', documentId] });
      toast({
        title: "Success",
        description: "Document shared successfully",
      });
      setShowShareForm(false);
      resetShareForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share document",
        variant: "destructive",
      });
    },
  });

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      return apiRequest('DELETE', `/api/documents/${documentId}/shares/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-shares', documentId] });
      toast({
        title: "Success",
        description: "Share access revoked",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke share access",
        variant: "destructive",
      });
    },
  });

  // Update share mutation
  const updateShareMutation = useMutation({
    mutationFn: async ({ shareId, updates }: { shareId: string; updates: any }) => {
      return apiRequest('PATCH', `/api/documents/${documentId}/shares/${shareId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-shares', documentId] });
      toast({
        title: "Success",
        description: "Share settings updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update share settings",
        variant: "destructive",
      });
    },
  });

  const resetShareForm = () => {
    setShareForm({
      type: 'user',
      targetId: '',
      email: '',
      accessLevel: 'view',
      expiresIn: '30',
      message: '',
      requirePassword: false,
      password: '',
      notifyByEmail: true
    });
  };

  const handleCreateShare = async () => {
    const expiresAt = shareForm.expiresIn ? 
      addDays(new Date(), parseInt(shareForm.expiresIn)).toISOString() : 
      null;

    const shareData = {
      shared_with_type: shareForm.type,
      shared_with_id: shareForm.type !== 'external' ? shareForm.targetId : null,
      shared_with_email: shareForm.type === 'external' ? shareForm.email : null,
      access_level: shareForm.accessLevel,
      expires_at: expiresAt,
      message: shareForm.message,
      require_password: shareForm.requirePassword,
      password: shareForm.requirePassword ? shareForm.password : null,
      notify_by_email: shareForm.notifyByEmail
    };

    createShareMutation.mutate(shareData);
  };

  const handleCopyShareUrl = async (shareUrl: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(shareId);
      toast({
        title: "Success",
        description: "Share URL copied to clipboard",
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const getAccessLevelIcon = (level: string) => {
    const accessLevel = ACCESS_LEVELS.find(al => al.value === level);
    return accessLevel ? accessLevel.icon : Eye;
  };

  const getAccessLevelColor = (level: string) => {
    const colors = {
      view: 'bg-blue-100 text-blue-800',
      download: 'bg-green-100 text-green-800',
      edit: 'bg-orange-100 text-orange-800'
    };
    return colors[level as keyof typeof colors] || colors.view;
  };

  const getShareTypeIcon = (type: string) => {
    const shareType = SHARE_TYPES.find(st => st.value === type);
    return shareType ? shareType.icon : Users;
  };

  const getShareDisplayName = (share: DocumentShare) => {
    switch (share.shared_with_type) {
      case 'user':
        return share.user_name || 'Unknown User';
      case 'team':
        return share.team_name || 'Unknown Team';
      case 'customer':
        return share.customer_name || 'Unknown Customer';
      case 'external':
        return share.shared_with_email || 'External User';
      default:
        return 'Unknown';
    }
  };

  const isExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Share Document - {documentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Document Access</h3>
              <p className="text-sm text-muted-foreground">
                Manage who can access this document and their permission levels
              </p>
            </div>
            <Button onClick={() => setShowShareForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Share Document
            </Button>
          </div>

          {/* Current Shares */}
          <div className="space-y-3">
            <h4 className="font-medium">Current Shares ({shares.length})</h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-lg">Loading shares...</div>
              </div>
            ) : shares.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Shield className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">This document is not shared with anyone</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              shares.map((share: DocumentShare) => {
                const ShareTypeIcon = getShareTypeIcon(share.shared_with_type);
                const AccessIcon = getAccessLevelIcon(share.access_level);
                const expired = isExpired(share.expires_at);
                
                return (
                  <Card key={share.id} className={`${!share.is_active || expired ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ShareTypeIcon className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium">{getShareDisplayName(share)}</h5>
                              {expired && (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              )}
                              {!share.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center">
                                <AccessIcon className="mr-1 h-3 w-3" />
                                {share.access_level}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                Shared {format(new Date(share.created_at), 'MMM d, yyyy')}
                              </div>
                              {share.expires_at && (
                                <div className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Expires {format(new Date(share.expires_at), 'MMM d, yyyy')}
                                </div>
                              )}
                              <div>
                                {share.access_count} {share.access_count === 1 ? 'access' : 'accesses'}
                              </div>
                              {share.last_accessed && (
                                <div>
                                  Last accessed {format(new Date(share.last_accessed), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getAccessLevelColor(share.access_level)}>
                            {share.access_level}
                          </Badge>
                          
                          {share.share_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyShareUrl(share.share_url!, share.id)}
                            >
                              {copiedUrl === share.id ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateShareMutation.mutate({
                              shareId: share.id,
                              updates: { is_active: !share.is_active }
                            })}
                          >
                            {share.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeShareMutation.mutate(share.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Share Statistics */}
          {shares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sharing Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{shares.length}</div>
                    <div className="text-xs text-muted-foreground">Total Shares</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {shares.filter(s => s.is_active && !isExpired(s.expires_at)).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Shares</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {shares.reduce((sum, s) => sum + s.access_count, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Accesses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(shares.map(s => s.shared_with_type)).size}
                    </div>
                    <div className="text-xs text-muted-foreground">Share Types</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Share Form Dialog */}
        {showShareForm && (
          <Dialog open={showShareForm} onOpenChange={setShowShareForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share Document</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="share-type">Share With</Label>
                  <Select
                    value={shareForm.type}
                    onValueChange={(value: any) => setShareForm(prev => ({ ...prev, type: value, targetId: '', email: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHARE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {shareForm.type === 'external' ? (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shareForm.email}
                      onChange={(e) => setShareForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="target">
                      Select {shareForm.type === 'user' ? 'User' : shareForm.type === 'team' ? 'Team' : 'Customer'}
                    </Label>
                    <Select
                      value={shareForm.targetId}
                      onValueChange={(value) => setShareForm(prev => ({ ...prev, targetId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${shareForm.type}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(shareForm.type === 'user' ? users : 
                          shareForm.type === 'team' ? teams : 
                          customers).map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name || item.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="access-level">Access Level</Label>
                  <Select
                    value={shareForm.accessLevel}
                    onValueChange={(value: any) => setShareForm(prev => ({ ...prev, accessLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <level.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{level.label}</div>
                              <div className="text-xs text-muted-foreground">{level.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expires-in">Expires In (Days)</Label>
                  <Select
                    value={shareForm.expiresIn}
                    onValueChange={(value) => setShareForm(prev => ({ ...prev, expiresIn: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="7">1 Week</SelectItem>
                      <SelectItem value="30">1 Month</SelectItem>
                      <SelectItem value="90">3 Months</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                      <SelectItem value="">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={shareForm.message}
                    onChange={(e) => setShareForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a message for the recipient..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-email"
                    checked={shareForm.notifyByEmail}
                    onCheckedChange={(checked) => setShareForm(prev => ({ ...prev, notifyByEmail: checked }))}
                  />
                  <Label htmlFor="notify-email">Send email notification</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowShareForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateShare}
                    disabled={createShareMutation.isPending || 
                      (shareForm.type === 'external' ? !shareForm.email : !shareForm.targetId)}
                  >
                    {createShareMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
