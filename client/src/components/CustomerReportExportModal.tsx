import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export default function CustomerReportExportModal({
  isOpen,
  onClose,
  customerId,
  customerName
}: CustomerReportExportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'overview',
    'processes',
    'contacts',
    'documents',
    'services',
    'teams'
  ]);

  const sections = [
    { id: 'overview', label: 'Customer Overview', description: 'Basic information and summary statistics' },
    { id: 'processes', label: 'Processes', description: 'All customer processes and their status' },
    { id: 'contacts', label: 'Contacts', description: 'Customer contact information' },
    { id: 'documents', label: 'Documents', description: 'Document library and files' },
    { id: 'services', label: 'Services', description: 'Service agreements and monthly hours' },
    { id: 'teams', label: 'Teams', description: 'Assigned teams and their details' },
    { id: 'analytics', label: 'Analytics', description: 'Performance metrics and insights' },
    { id: 'timeline', label: 'Recent Activity', description: 'Timeline of recent events' },
    { id: 'notes', label: 'Notes', description: 'Customer notes and important dates' }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateReport = async () => {
    if (selectedSections.length === 0) {
      alert('Please select at least one section to include in the report.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/customers/${customerId}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          options: {
            format,
            orientation,
            includeCharts,
            sections: selectedSections
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText size={20} />
            <span>Export Customer Report - {customerName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Report Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Page Size</Label>
                  <RadioGroup
                    value={format}
                    onValueChange={(value: 'A4' | 'Letter') => setFormat(value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A4" id="a4" />
                      <Label htmlFor="a4">A4 (210 × 297 mm)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Letter" id="letter" />
                      <Label htmlFor="letter">Letter (8.5 × 11 in)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm font-medium">Orientation</Label>
                  <RadioGroup
                    value={orientation}
                    onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait">Portrait</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape">Landscape</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  />
                  <Label htmlFor="charts" className="text-sm">
                    Include charts and visualizations
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Selection */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div key={section.id} className="flex items-start space-x-3 p-3 border border-neutral-200 rounded-lg">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => handleSectionToggle(section.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={section.id} className="text-sm font-medium cursor-pointer">
                          {section.label}
                        </Label>
                        <p className="text-xs text-neutral-600 mt-1">{section.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-sm text-neutral-600">
                  <p>{selectedSections.length} of {sections.length} sections selected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
          <div className="text-sm text-neutral-600">
            Report will be downloaded as a PDF file
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || selectedSections.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={16} />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}