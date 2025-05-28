import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-xl flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-semibold text-neutral-800 mb-2">
              Welcome to DM_CRM
            </h1>
            
            <p className="text-neutral-600 mb-8">
              Comprehensive Customer Relationship Management for B2B consulting with 
              customer management, process tracking, AI integration, and team coordination.
            </p>
            
            <Button 
              onClick={() => window.location.href = '/api/auth/login'}
              className="w-full bg-primary hover:bg-primary-600"
            >
              Sign In to Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
