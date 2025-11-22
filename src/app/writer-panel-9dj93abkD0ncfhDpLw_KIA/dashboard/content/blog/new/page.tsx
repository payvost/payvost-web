'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewBlogPostPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/writer-panel-9dj93abkD0ncfhDpLw_KIA/dashboard/content/new?type=BLOG');
  }, [router]);
  
  return null;
}

