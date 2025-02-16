"use client";

import { AuthCheck } from '@/components/AuthCheck';
import { UserSettings } from '@/components/UserSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const requiresWhatsapp = searchParams.get('required') === 'whatsapp';

  return (
    <AuthCheck>
      <div className="container max-w-7xl mx-auto px-6 py-8">
        {requiresWhatsapp && (
          <Alert className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
            <AlertDescription>
              Please add your WhatsApp number to continue with generation.
            </AlertDescription>
          </Alert>
        )}
        <UserSettings />
      </div>
    </AuthCheck>
  );
}