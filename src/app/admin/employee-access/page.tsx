"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeAccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // employee-cardsページにリダイレクト
    router.replace('/admin/employee-cards');
  }, [router]);

  return (
    <div>
      リダイレクト中...
    </div>
  );
}
