'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MyQrPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/scan');
  }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );
}
