import { setRequestLocale } from 'next-intl/server';
import { SignInForm } from './sign-in-form';

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <SignInForm next={next} error={error} />
    </main>
  );
}
