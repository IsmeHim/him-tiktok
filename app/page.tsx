import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/jwt';

export default async function HomePage() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
