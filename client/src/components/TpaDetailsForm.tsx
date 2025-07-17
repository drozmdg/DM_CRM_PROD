import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface TpaDetailsFormProps {
  form: any; // React Hook Form instance
  contacts: any[]; // Customer contacts
  isEditMode?: boolean;
  onSubmit?: () => void; // Optional submit handler
  isSubmitting?: boolean; // Optional loading state
}

export default function TpaDetailsForm({ form, contacts, isEditMode = false, onSubmit, isSubmitting }: TpaDetailsFormProps) {
  const isTpaRequired = form.watch("isTpaRequired");
  const tpaStartDate = form.watch("tpaStartDate");
  const tpaEndDate = form.watch("tpaEndDate");

  // Clear TPA fields when TPA is not required
  useEffect(() => {
    if (!isTpaRequired) {
      form.setValue("tpaResponsibleContactId", "");
      form.setValue("tpaDataSource", "");
      form.setValue("tpaStartDate", "");
      form.setValue("tpaEndDate", "");
    }
  }, [isTpaRequired, form]);

  // Date validation
  const dateError = tpaStartDate && tpaEndDate && new Date(tpaEndDate) < new Date(tpaStartDate);

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Third-Party Agreements (TPAs) are required when a process needs access to specific customer data sources. 
          Enabling this will ensure proper data governance and compliance tracking.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isTpaRequired"
            checked={isTpaRequired || false}
            onCheckedChange={(checked) => form.setValue("isTpaRequired", checked)}
          />
          <Label htmlFor="isTpaRequired" className="cursor-pointer">
            Is a TPA Required?
          </Label>
        </div>

        {isTpaRequired && (
          <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <Label htmlFor="tpaResponsibleContactId">TPA Responsible Person *</Label>
              <Select 
                value={form.watch("tpaResponsibleContactId")} 
                onValueChange={(value) => form.setValue("tpaResponsibleContactId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select responsible contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact: any) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} - {contact.title || contact.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tpaDataSource">Data Source Name *</Label>
              <Input
                id="tpaDataSource"
                {...form.register("tpaDataSource")}
                placeholder="e.g., Clinical Trial Database, Patient Registry"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tpaStartDate">TPA Start Date *</Label>
                <Input
                  id="tpaStartDate"
                  type="date"
                  {...form.register("tpaStartDate")}
                />
              </div>

              <div>
                <Label htmlFor="tpaEndDate">TPA End Date *</Label>
                <Input
                  id="tpaEndDate"
                  type="date"
                  {...form.register("tpaEndDate")}
                  className={dateError ? "border-destructive" : ""}
                />
                {dateError && (
                  <p className="text-sm text-destructive mt-1">
                    End date must be after start date
                  </p>
                )}
              </div>
            </div>

            {isTpaRequired && (!form.watch("tpaResponsibleContactId") || 
                              !form.watch("tpaDataSource") || 
                              !form.watch("tpaStartDate") || 
                              !form.watch("tpaEndDate")) && (
              <Alert variant="destructive">
                <AlertDescription>
                  All TPA fields are required when TPA is enabled
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {onSubmit && (
        <div className="flex justify-end pt-6 border-t">
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Saving..." : "Update TPA"}
          </Button>
        </div>
      )}
    </div>
  );
}