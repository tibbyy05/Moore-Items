'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { user, customer, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isOAuth, setIsOAuth] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsOAuth(user.app_metadata?.provider === 'google');
    if (customer) {
      setFullName(customer.full_name || '');
      setPhone(customer.phone || '');
    }
    setLoading(false);
  }, [router, user, customer, authLoading]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileSuccess(false);
    const supabase = createClient();

    await supabase
      .from('mi_customers')
      .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);

    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    setProfileSaving(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setEmailSaving(true);
    setEmailMessage('');
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailMessage(error.message);
    } else {
      setEmailMessage('Confirmation email sent to your new address. Please check your inbox.');
      setNewEmail('');
    }
    setEmailSaving(false);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordSaving(false);
  };

  if (loading || authLoading) return <p className="text-warm-600 py-12">Loading...</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-playfair font-semibold text-warm-900">Account Settings</h2>

      <div className="bg-warm-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gold-500" />
          <h3 className="text-lg font-semibold text-warm-900">Profile Information</h3>
        </div>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-warm-900 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-900 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              placeholder="(555) 555-5555"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {profileSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-warm-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gold-500" />
          <h3 className="text-lg font-semibold text-warm-900">Email Address</h3>
        </div>
        <p className="text-sm text-warm-600 mb-4">
          Current email: <span className="font-medium text-warm-900">{user?.email}</span>
        </p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-warm-900 mb-2">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              placeholder="newemail@example.com"
            />
          </div>
          {emailMessage && (
            <p
              className={`text-sm ${
                emailMessage.includes('Confirmation') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {emailMessage}
            </p>
          )}
          <button
            onClick={handleEmailChange}
            disabled={emailSaving || !newEmail}
            className="px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm disabled:opacity-50"
          >
            {emailSaving ? 'Sending...' : 'Update Email'}
          </button>
        </div>
      </div>

      <div className="bg-warm-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gold-500" />
          <h3 className="text-lg font-semibold text-warm-900">Change Password</h3>
        </div>
        {isOAuth ? (
          <p className="text-sm text-warm-600">
            You signed in with Google. Password management is handled through your Google account.
          </p>
        ) : (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="••••••••"
              />
            </div>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !newPassword || !confirmPassword}
              className="px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm disabled:opacity-50"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
