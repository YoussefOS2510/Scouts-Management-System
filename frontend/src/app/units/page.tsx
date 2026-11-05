'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

function UnitsIndexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessibleUnits, isLoadingPermissions } = useAuth();

  useEffect(() => {
    if (isLoadingPermissions) return;

    const queryUnit = searchParams.get('unitId') || searchParams.get('unit');
    if (queryUnit) {
      router.replace(`/units/${queryUnit}`);
      return;
    }

    if (accessibleUnits.length > 0) {
      router.replace(`/units/${accessibleUnits[0].id}`);
    } else {
      router.replace('/units/1');
    }
  }, [searchParams, accessibleUnits, isLoadingPermissions, router]);

  return (
    <div className="p-8 text-center text-xs text-neutral-400">
      Loading unit...
    </div>
  );
}

export default function UnitsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading...</div>}>
      <UnitsIndexContent />
    </Suspense>
  );
}

