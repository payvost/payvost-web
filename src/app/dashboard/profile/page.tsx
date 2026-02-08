'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit, Loader2, Settings } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import type { LanguagePreference } from '@/types/language';
import type { KycStatus } from '@/types/kyc';
import { normalizeKycStatus } from '@/types/kyc';

import { ProfileOverviewCard } from '@/components/profile/profile-overview-card';
import { ProfileSecurityCard } from '@/components/profile/profile-security-card';
import { ProfilePersonalInfoCard, type PersonalInfoValues } from '@/components/profile/profile-personal-info-card';
import { ProfileAccountDetailsCard } from '@/components/profile/profile-account-details-card';
import { ProfileIdentityCard } from '@/components/profile/profile-identity-card';
import { ProfileKycTiersCard } from '@/components/profile/profile-kyc-tiers-card';

type KycBadge = { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string };

function kycBadgeFor(status: KycStatus): KycBadge {
  switch (status) {
    case 'verified':
      return { label: 'Verified', variant: 'default', className: 'bg-green-600 text-white' };
    case 'pending':
      return { label: 'Pending', variant: 'secondary' };
    case 'restricted':
      return { label: 'Restricted', variant: 'destructive' };
    case 'rejected':
      return { label: 'Rejected', variant: 'destructive' };
    case 'unverified':
    default:
      return { label: 'Unverified', variant: 'outline' };
  }
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [language, setLanguage] = useState<LanguagePreference>('en');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<PersonalInfoValues>({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);

        const kycStatus = normalizeKycStatus(data?.kycStatus);
        if (kycStatus === 'verified') {
          setEditing((prev) => {
            if (prev) {
              toast({
                title: 'Edit mode disabled',
                description: 'Personal information editing is disabled after KYC verification.',
              });
            }
            return false;
          });
        }

        // Keep local inputs in sync unless the user is actively editing.
        setValues((prev) => {
          if (editing) return prev;
          return {
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            street: data.street || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
          };
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading, toast, editing]);

  const currentKycStatus: KycStatus = normalizeKycStatus(userData?.kycStatus);
  const locked = currentKycStatus === 'verified';

  const overviewBadges = useMemo(() => {
    const badge = kycBadgeFor(currentKycStatus);
    const tier = String(userData?.userType || 'Pending');
    return [
      { label: badge.label, variant: badge.variant, className: badge.className },
      { label: tier, variant: 'secondary' as const },
    ];
  }, [currentKycStatus, userData?.userType]);

  const accountDetails = userData?.accountDetails || {};
  const activeWallets = userData?.wallets?.map((w: any) => w.currency) || [];
  const walletBalances =
    userData?.wallets?.reduce((acc: Record<string, number>, w: any) => {
      acc[w.currency] = w.balance || 0;
      return acc;
    }, {}) || {};

  const onPhotoSelected = (file: File, url: string) => {
    setImageFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const cancelEdit = () => {
    setEditing(false);
    setImageFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setValues({
      name: userData?.name || user?.displayName || '',
      phone: userData?.phone || '',
      street: userData?.street || '',
      city: userData?.city || '',
      state: userData?.state || '',
      zip: userData?.zip || '',
    });
  };

  const save = async () => {
    if (!user) return;

    if (locked) {
      toast({
        title: 'Cannot update',
        description: 'Personal information cannot be edited after KYC verification.',
        variant: 'destructive',
      });
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      let photoURL: string | null = userData?.photoURL || user.photoURL || null;

      if (imageFile) {
        const fileRef = ref(storage, `profile_pictures/${user.uid}/avatar.jpg`);
        await uploadBytes(fileRef, imageFile);
        photoURL = await getDownloadURL(fileRef);
      }

      await updateProfile(user, { displayName: values.name, photoURL: photoURL || undefined });

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: values.name,
        photoURL: photoURL,
        phone: values.phone,
        street: values.street,
        city: values.city,
        state: values.state,
        zip: values.zip,
      });

      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      setEditing(false);
      setImageFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: 'Could not save your profile changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex-1 p-4 lg:p-6">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage personal details, verification, and receiving accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>

            {!editing ? (
              !locked ? (
                <Button onClick={() => setEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit profile
                </Button>
              ) : null
            ) : (
              <>
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview (desktop left, mobile first) */}
          <div className="lg:col-span-1 lg:col-start-1 lg:row-start-1 order-1">
            <ProfileOverviewCard
              name={values.name || user?.displayName || 'User'}
              email={user?.email || ''}
              photoUrl={userData?.photoURL || user?.photoURL || null}
              previewUrl={previewUrl}
              badges={overviewBadges}
              editing={editing}
              locked={locked}
              disabled={saving}
              onPhotoSelected={onPhotoSelected}
            />
          </div>

          {/* Main sections */}
          <div className="lg:col-span-2 lg:col-start-2 lg:row-start-1 order-2 space-y-6">
            <ProfilePersonalInfoCard
              editing={editing}
              locked={locked}
              disabled={saving}
              email={user?.email || ''}
              country={userData?.country || null}
              values={values}
              onChange={(next) => setValues((v) => ({ ...v, ...next }))}
            />

            <ProfileAccountDetailsCard
              accountDetails={accountDetails}
              activeWallets={activeWallets}
              walletBalances={walletBalances}
            />

            <ProfileIdentityCard
              idType={userData?.idType || null}
              idNumber={userData?.idNumber || null}
              bvn={userData?.bvn || null}
              kycStatus={userData?.kycStatus}
            />

            <ProfileKycTiersCard userData={userData} />
          </div>

          {/* Security (desktop left under overview, mobile last) */}
          <div className="lg:col-span-1 lg:col-start-1 lg:row-start-2 order-3">
            <ProfileSecurityCard />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

