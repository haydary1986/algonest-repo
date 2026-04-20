import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routing, type Locale } from '@/i18n/routing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisibilityToggle } from '@/components/manage/visibility-toggle';
import { ProfileCompleteness } from '@/components/manage/profile-completeness';
import { computeCompleteness } from '@/lib/profile/completeness';
import { BasicTab } from '@/components/manage/tabs/basic-tab';
import { AcademicTab } from '@/components/manage/tabs/academic-tab';
import { ResearchTab } from '@/components/manage/tabs/research-tab';
import { ContactTab } from '@/components/manage/tabs/contact-tab';
import { ExperienceTab } from '@/components/manage/tabs/experience-tab';
import { PublicationsTab } from '@/components/manage/tabs/publications-tab';
import type {
  AcademicTitleLookup,
  BilingualLookup,
  DepartmentLookup,
  PublicationRow,
  WorkExperienceRow,
  CertificationRow,
  AwardRow,
  ProjectRow,
  SkillRow,
  LanguageRow,
  SocialProfileRow,
} from '@/lib/profile/types';

export const dynamic = 'force-dynamic';

interface ManageProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ManageProfilePage({ params }: ManageProfilePageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('manage');

  const { data: ownerFull, error: ownerErr } = await supabase
    .from('researchers_owner')
    .select(
      'id, full_name_en, full_name_ar, employee_id, gender_id, birthdate, academic_title_id, profile_image, workplace_type_id, college_id, department_id, university_center_id, degree_en, degree_ar, degree_minor_en, degree_minor_ar, bio_en, bio_ar, field_of_interest_en, field_of_interest_ar, website, show_public_contact, private_email, private_phone, private_office_location, private_office_hours, private_mailing_address, public_email, public_phone, public_office_location, public_office_hours, public_mailing_address, is_public, admin_visibility_override',
    )
    .maybeSingle();

  if (ownerErr) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="bg-destructive/10 rounded-lg border border-destructive/30 p-6 text-center">
          <p className="text-destructive text-sm">Error loading profile: {ownerErr.message}</p>
        </div>
      </main>
    );
  }

  if (!ownerFull) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="bg-muted/40 rounded-lg border p-6 text-center">
          <p className="text-muted-foreground text-sm">{t('no_profile')}</p>
        </div>
      </main>
    );
  }

  const researcherId = ownerFull.id;

  const [
    genders,
    titlesRes,
    wt,
    colleges,
    departments,
    ucs,
    pubTypes,
    pubSources,
    pubsRes,
    workRes,
    certsRes,
    awardsRes,
    projectsRes,
    skillsRes,
    langsRes,
    socialsRes,
  ] = await Promise.all([
    supabase.from('genders').select('id, name_en, name_ar').order('name_en'),
    supabase
      .from('academic_titles')
      .select('id, name_en, name_ar, rank')
      .order('rank', { ascending: false }),
    supabase.from('workplace_types').select('id, name_en, name_ar').order('name_en'),
    supabase.from('colleges').select('id, name_en, name_ar').order('name_en'),
    supabase.from('departments').select('id, name_en, name_ar, college_id').order('name_en'),
    supabase.from('university_centers').select('id, name_en, name_ar').order('name_en'),
    supabase.from('publication_types').select('id, name_en, name_ar').order('name_en'),
    supabase.from('publication_sources').select('id, name').order('name'),
    supabase
      .from('researcher_publications')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('publication_year', { ascending: false }),
    supabase
      .from('researcher_work_experience')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
    supabase
      .from('researcher_certifications')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
    supabase
      .from('researcher_awards')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('year', { ascending: false }),
    supabase
      .from('researcher_projects')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
    supabase
      .from('researcher_skills')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
    supabase
      .from('researcher_languages')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
    supabase
      .from('researcher_social_profiles')
      .select('*')
      .eq('researcher_id', researcherId)
      .order('display_order'),
  ]);

  const publications = (pubsRes.data ?? []) as PublicationRow[];
  const work = (workRes.data ?? []) as WorkExperienceRow[];
  const certifications = (certsRes.data ?? []) as CertificationRow[];
  const awards = (awardsRes.data ?? []) as AwardRow[];
  const projects = (projectsRes.data ?? []) as ProjectRow[];
  const skills = (skillsRes.data ?? []) as SkillRow[];
  const languages = (langsRes.data ?? []) as LanguageRow[];
  const socials = (socialsRes.data ?? []) as SocialProfileRow[];

  const skillsCsv = skills.map((s) => s.name_en).join(', ');
  const languagesCsv = languages.map((l) => `${l.language_code}:${l.proficiency}`).join(', ');
  const socialsBlock = socials.map((s) => `${s.platform}|${s.url}`).join('\n');

  const typedLocale = locale as Locale;

  const completeness = computeCompleteness(
    {
      full_name_en: ownerFull.full_name_en,
      full_name_ar: ownerFull.full_name_ar,
      gender_id: ownerFull.gender_id,
      academic_title_id: ownerFull.academic_title_id,
      profile_image: ownerFull.profile_image,
      birthdate: ownerFull.birthdate,
      workplace_type_id: ownerFull.workplace_type_id,
      college_id: ownerFull.college_id,
      department_id: ownerFull.department_id,
      degree_en: ownerFull.degree_en,
      degree_ar: ownerFull.degree_ar,
      bio_en: ownerFull.bio_en,
      bio_ar: ownerFull.bio_ar,
      field_of_interest_en: ownerFull.field_of_interest_en,
      field_of_interest_ar: ownerFull.field_of_interest_ar,
      website: ownerFull.website,
      public_email: ownerFull.public_email,
      public_phone: ownerFull.public_phone,
      private_email: ownerFull.private_email,
      private_phone: ownerFull.private_phone,
    },
    {
      publications: publications.length,
      work: work.length,
      certifications: certifications.length,
      awards: awards.length,
      projects: projects.length,
      skills: skills.length,
      languages: languages.length,
      socials: socials.length,
    },
  );

  return (
    <main className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      <ProfileCompleteness
        result={completeness}
        titleLabel={t('completeness.title')}
        tipLabel={t('completeness.tip')}
        openDetailsLabel={t('completeness.open_details')}
      />

      <VisibilityToggle
        initial={Boolean(ownerFull.is_public)}
        override={ownerFull.admin_visibility_override as 'force_show' | 'force_hide' | null}
      />

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="basic">{t('tabs.basic')}</TabsTrigger>
          <TabsTrigger value="academic">{t('tabs.academic')}</TabsTrigger>
          <TabsTrigger value="research">{t('tabs.research')}</TabsTrigger>
          <TabsTrigger value="contact">{t('tabs.contact')}</TabsTrigger>
          <TabsTrigger value="experience">{t('tabs.experience')}</TabsTrigger>
          <TabsTrigger value="publications">{t('tabs.publications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <BasicTab
            initial={{
              full_name_en: ownerFull.full_name_en,
              full_name_ar: ownerFull.full_name_ar,
              employee_id: ownerFull.employee_id ?? undefined,
              gender_id: ownerFull.gender_id,
              birthdate: ownerFull.birthdate ?? undefined,
              academic_title_id: ownerFull.academic_title_id,
              profile_image: ownerFull.profile_image ?? undefined,
              full_name_initial:
                typedLocale === 'ar' ? ownerFull.full_name_ar : ownerFull.full_name_en,
            }}
            genders={(genders.data ?? []) as BilingualLookup[]}
            academicTitles={(titlesRes.data ?? []) as AcademicTitleLookup[]}
            locale={typedLocale}
          />
        </TabsContent>

        <TabsContent value="academic" className="mt-6">
          <AcademicTab
            initial={{
              workplace_type_id: ownerFull.workplace_type_id,
              college_id: ownerFull.college_id,
              department_id: ownerFull.department_id,
              university_center_id: ownerFull.university_center_id,
              degree_en: ownerFull.degree_en ?? undefined,
              degree_ar: ownerFull.degree_ar ?? undefined,
              degree_minor_en: ownerFull.degree_minor_en ?? undefined,
              degree_minor_ar: ownerFull.degree_minor_ar ?? undefined,
            }}
            workplaceTypes={(wt.data ?? []) as BilingualLookup[]}
            colleges={(colleges.data ?? []) as BilingualLookup[]}
            departments={(departments.data ?? []) as DepartmentLookup[]}
            universityCenters={(ucs.data ?? []) as BilingualLookup[]}
            locale={typedLocale}
          />
        </TabsContent>

        <TabsContent value="research" className="mt-6">
          <ResearchTab
            initial={{
              bio_en: ownerFull.bio_en ?? undefined,
              bio_ar: ownerFull.bio_ar ?? undefined,
              field_of_interest_en: ownerFull.field_of_interest_en ?? undefined,
              field_of_interest_ar: ownerFull.field_of_interest_ar ?? undefined,
              website: ownerFull.website ?? undefined,
              skills_csv: skillsCsv || undefined,
              languages_csv: languagesCsv || undefined,
              socials_block: socialsBlock || undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <ContactTab
            initial={{
              show_public_contact: Boolean(ownerFull.show_public_contact),
              private_email: ownerFull.private_email ?? undefined,
              private_phone: ownerFull.private_phone ?? undefined,
              private_office_location: ownerFull.private_office_location ?? undefined,
              private_office_hours: ownerFull.private_office_hours ?? undefined,
              private_mailing_address: ownerFull.private_mailing_address ?? undefined,
              public_email: ownerFull.public_email ?? undefined,
              public_phone: ownerFull.public_phone ?? undefined,
              public_office_location: ownerFull.public_office_location ?? undefined,
              public_office_hours: ownerFull.public_office_hours ?? undefined,
              public_mailing_address: ownerFull.public_mailing_address ?? undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="experience" className="mt-6">
          <ExperienceTab
            work={work}
            certifications={certifications}
            awards={awards}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="publications" className="mt-6">
          <PublicationsTab
            publications={publications}
            publicationTypes={(pubTypes.data ?? []) as BilingualLookup[]}
            publicationSources={(pubSources.data ?? []) as { id: string; name: string }[]}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
