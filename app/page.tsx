import SchoolHomepage from '@/components/SchoolHomepage';
import { getSiteTerpadu } from '@/lib/katalog';
import { grafOrganisasi, jsonLdAman } from '@/lib/seo';

export const revalidate = 60;

export default async function HomePage() {
  const content = await getSiteTerpadu();
  return (
    <>
      <SchoolHomepage content={content} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdAman(grafOrganisasi(content)) }} />
    </>
  );
}
