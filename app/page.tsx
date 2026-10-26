import SchoolHomepage from '@/components/SchoolHomepage';
import { getSiteContent } from '@/lib/site-content';
import { grafOrganisasi, jsonLdAman } from '@/lib/seo';

export const revalidate = 60;

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <SchoolHomepage content={content} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdAman(grafOrganisasi(content)) }} />
    </>
  );
}
