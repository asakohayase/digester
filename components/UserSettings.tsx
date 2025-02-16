import React, { useState, useEffect } from 'react';
import { useStytchUser } from '@stytch/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function UserSettings() {
  const { user } = useStytchUser();
  const [profile, setProfile] = useState({
    full_name: '',
    whatsapp_number: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user_id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          whatsapp_number: data.whatsapp_number || '',
          email: user.emails[0]?.email || ''
        });
      }
    }

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (profile.whatsapp_number !== '' && 
        (!profile.whatsapp_number.startsWith('+') || 
         profile.whatsapp_number.length < 10)) {
      setError('Please enter a valid WhatsApp number with country code (e.g., +1234567890)');
      setLoading(false);
      return;
    }

    try {
      // Check if number is already registered to another user
      if (profile.whatsapp_number) {
        const { data: existingUser} = await supabase
          .from('profiles')
          .select('id')
          .eq('whatsapp_number', profile.whatsapp_number)
          .neq('id', user?.user_id)
          .single();

        if (existingUser) {
          setError('This WhatsApp number is already registered to another account');
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          whatsapp_number: profile.whatsapp_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.user_id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
    } catch  {
      setError('Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input value={profile.email} disabled />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
            <Input
              value={profile.whatsapp_number}
              onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
              placeholder="+1234567890"
              type="tel"
            />
            <p className="text-sm text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}