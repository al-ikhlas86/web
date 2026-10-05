import SchoolHomepage from '@/components/SchoolHomepage';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;

export default async function HomePage() {
  return <SchoolHomepage content={await getSiteContent()} />;
}
