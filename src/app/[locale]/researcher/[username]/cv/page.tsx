import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { fetchProfileByUsername } from '@/lib/profile/fetch';
import { routing } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';

interface CvPageProps {
  params: Promise<{ locale: string; username: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CvPage({ params }: CvPageProps) {
  const { locale, username } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const payload = await fetchProfileByUsername(username);
  if (!payload) notFound();

  const {
    profile,
    education,
    work,
    awards,
    publications,
    certifications,
    projects,
    skills,
    languages,
    socials,
    lookups,
  } = payload;
  const isAr = locale === 'ar';

  const name = isAr ? profile.full_name_ar : profile.full_name_en;
  const titleObj = profile.academic_title_id
    ? lookups.titleById.get(profile.academic_title_id)
    : null;
  const collegeObj = profile.college_id ? lookups.collegeById.get(profile.college_id) : null;
  const deptObj = profile.department_id ? lookups.departmentById.get(profile.department_id) : null;
  const titleName = titleObj ? (isAr ? titleObj.name_ar : titleObj.name_en) : null;
  const collegeName = collegeObj ? (isAr ? collegeObj.name_ar : collegeObj.name_en) : null;
  const deptName = deptObj ? (isAr ? deptObj.name_ar : deptObj.name_en) : null;

  const bio = isAr ? profile.bio_ar : profile.bio_en;
  const interests = isAr ? profile.field_of_interest_ar : profile.field_of_interest_en;
  const hIndex = profile.scopus_h_index ?? profile.openalex_h_index ?? 0;
  const totalPubs =
    profile.scopus_publications_count ?? profile.openalex_publications_count ?? publications.length;
  const totalCitations =
    (profile.scopus_citations_count ?? 0) +
    (profile.wos_citations_count ?? 0) +
    (profile.openalex_citations_count ?? 0);

  const orcidUrl = socials.find((s) => s.platform === 'orcid')?.url;
  const scopusUrl = socials.find((s) => s.platform === 'scopus')?.url;
  const scholarUrl = socials.find((s) => s.platform === 'google_scholar')?.url;
  const linkedinUrl = socials.find((s) => s.platform === 'linkedin')?.url;

  let logoUrl = '';
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'branding.logo_url')
      .maybeSingle();
    if (data?.value) logoUrl = String(data.value).replace(/^"|"$/g, '');
  } catch {}

  const dir = isAr ? 'rtl' : 'ltr';
  const sidePos = isAr ? 'right' : 'left';
  const mainMargin = isAr ? 'margin-right' : 'margin-left';
  const floatDate = isAr ? 'left' : 'right';
  const pubPad = isAr ? 'padding-right' : 'padding-left';
  const pubBefore = isAr ? 'right' : 'left';

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body, html { background: white !important; }
          header, footer, .cv-toolbar { display: none !important; }
          .cv-wrapper { margin: 0 !important; box-shadow: none !important; }
        }
        @media screen {
          .cv-wrapper { margin: 20px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 4px; }
        }
        .cv-wrapper { width: 210mm; min-height: 297mm; position: relative; overflow: hidden; background: white; color: #1a202c; font-size: 10.5px; line-height: 1.55; direction: ${dir}; }
        .cv-sidebar { position: absolute; top: 0; ${sidePos}: 0; width: 68mm; min-height: 297mm; background: #1a365d; color: white; padding: 15mm 5mm; }
        .cv-main { ${mainMargin}: 68mm; padding: 12mm 10mm 15mm; min-height: 297mm; }
        .cv-sidebar h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.6); margin: 14px 0 6px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 3px; }
        .cv-sidebar .cv-item { margin-bottom: 5px; font-size: 10px; }
        .cv-sidebar .cv-item-label { color: rgba(255,255,255,0.7); font-size: 9px; }
        .cv-sidebar a { color: #90cdf4; text-decoration: none; font-size: 9px; word-break: break-all; }
        .cv-main h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 3px; margin: 16px 0 8px; }
        .cv-entry { margin-bottom: 7px; }
        .cv-entry-title { font-weight: 600; font-size: 10.5px; }
        .cv-entry-sub { color: #4a5568; font-size: 10px; }
        .cv-entry-date { color: #718096; font-size: 9.5px; float: ${floatDate}; }
        .cv-pub-list { counter-reset: pub; list-style: none; padding: 0; }
        .cv-pub-list li { counter-increment: pub; margin-bottom: 5px; ${pubPad}: 22px; position: relative; font-size: 10px; }
        .cv-pub-list li::before { content: counter(pub) "."; position: absolute; ${pubBefore}: 0; color: #2b6cb0; font-weight: 700; }
        .cv-metric { background: rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; text-align: center; margin-bottom: 4px; }
        .cv-metric-val { font-size: 20px; font-weight: 800; }
        .cv-metric-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); }
        .cv-skill-bar { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; margin-top: 2px; }
        .cv-skill-fill { height: 100%; background: #90cdf4; border-radius: 2px; }
        .cv-avatar { width: 90px; height: 90px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); object-fit: cover; display: block; margin: 0 auto 10px; }
      `}</style>

      {/* Toolbar */}
      <div className="cv-toolbar sticky top-16 z-30 flex items-center justify-between bg-muted px-6 py-2 print:hidden">
        <span className="text-sm font-medium text-muted-foreground">
          {isAr
            ? 'السيرة الذاتية — Ctrl+P للحفظ كـ PDF'
            : 'Curriculum Vitae — Press Ctrl+P to save as PDF'}
        </span>
        <button
          id="cv-print-btn"
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isAr ? '⬇ حفظ PDF' : '⬇ Save PDF'}
        </button>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.getElementById("cv-print-btn")?.addEventListener("click",()=>window.print())',
          }}
        />
      </div>

      <div className="cv-wrapper">
        {/* SIDEBAR */}
        <div className="cv-sidebar">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt="" className="cv-avatar" />
          ) : (
            <div
              className="cv-avatar"
              style={{
                background: '#2b6cb0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
              }}
            >
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}

          {(hIndex > 0 || totalPubs > 0) && (
            <>
              <h3>{isAr ? 'المؤشرات' : 'METRICS'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {hIndex > 0 && (
                  <div className="cv-metric">
                    <div className="cv-metric-val">{hIndex}</div>
                    <div className="cv-metric-label">h-index</div>
                  </div>
                )}
                {totalPubs > 0 && (
                  <div className="cv-metric">
                    <div className="cv-metric-val">{totalPubs}</div>
                    <div className="cv-metric-label">{isAr ? 'منشور' : 'Pubs'}</div>
                  </div>
                )}
                {totalCitations > 0 && (
                  <div className="cv-metric">
                    <div className="cv-metric-val">
                      {totalCitations > 999
                        ? `${(totalCitations / 1000).toFixed(1)}k`
                        : totalCitations}
                    </div>
                    <div className="cv-metric-label">{isAr ? 'اقتباس' : 'Citations'}</div>
                  </div>
                )}
              </div>
            </>
          )}

          <h3>{isAr ? 'التواصل' : 'CONTACT'}</h3>
          {profile.public_email && (
            <div className="cv-item">
              <div className="cv-item-label">{isAr ? 'البريد' : 'Email'}</div>
              <div>{profile.public_email}</div>
            </div>
          )}
          {profile.public_phone && (
            <div className="cv-item">
              <div className="cv-item-label">{isAr ? 'الهاتف' : 'Phone'}</div>
              <div>{profile.public_phone}</div>
            </div>
          )}
          {profile.website && (
            <div className="cv-item">
              <div className="cv-item-label">{isAr ? 'الموقع' : 'Website'}</div>
              <a href={profile.website}>{profile.website.replace('https://', '')}</a>
            </div>
          )}

          {(orcidUrl || scopusUrl || scholarUrl || linkedinUrl) && (
            <>
              <h3>{isAr ? 'الملفات البحثية' : 'PROFILES'}</h3>
              {orcidUrl && (
                <div className="cv-item">
                  <a href={orcidUrl}>ORCID</a>
                </div>
              )}
              {scopusUrl && (
                <div className="cv-item">
                  <a href={scopusUrl}>Scopus</a>
                </div>
              )}
              {scholarUrl && (
                <div className="cv-item">
                  <a href={scholarUrl}>Google Scholar</a>
                </div>
              )}
              {linkedinUrl && (
                <div className="cv-item">
                  <a href={linkedinUrl}>LinkedIn</a>
                </div>
              )}
            </>
          )}

          {skills.length > 0 && (
            <>
              <h3>{isAr ? 'المهارات' : 'SKILLS'}</h3>
              {skills.map((s) => {
                const level =
                  s.proficiency === 'expert'
                    ? 100
                    : s.proficiency === 'advanced'
                      ? 80
                      : s.proficiency === 'intermediate'
                        ? 60
                        : 40;
                return (
                  <div key={s.id} style={{ marginBottom: '5px' }}>
                    <div
                      style={{
                        fontSize: '9.5px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{s.name_en}</span>
                    </div>
                    <div className="cv-skill-bar">
                      <div className="cv-skill-fill" style={{ width: `${level}%` }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {languages.length > 0 && (
            <>
              <h3>{isAr ? 'اللغات' : 'LANGUAGES'}</h3>
              {languages.map((l) => (
                <div key={l.id} className="cv-item">
                  {l.language_name}{' '}
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
                    ({l.proficiency})
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* MAIN */}
        <div className="cv-main">
          <div
            style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#1a365d',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {name}
              </h1>
              {titleName && (
                <div
                  style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 600, marginTop: '2px' }}
                >
                  {titleName}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                {[deptName, collegeName, isAr ? 'الجامعة العراقية' : 'Al-Iraqia University']
                  .filter(Boolean)
                  .join(' • ')}
              </div>
            </div>
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                style={{ height: '35px', objectFit: 'contain', opacity: 0.8 }}
              />
            )}
          </div>

          {bio && (
            <>
              <h2>{isAr ? 'نبذة مختصرة' : 'ABOUT'}</h2>
              <p style={{ whiteSpace: 'pre-line', color: '#2d3748' }}>{bio}</p>
            </>
          )}
          {interests && (
            <>
              <h2>{isAr ? 'الاهتمامات البحثية' : 'RESEARCH INTERESTS'}</h2>
              <p style={{ color: '#2d3748' }}>{interests}</p>
            </>
          )}

          {education.length > 0 && (
            <>
              <h2>{isAr ? 'التحصيل الدراسي' : 'EDUCATION'}</h2>
              {education.map((e) => (
                <div key={e.id} className="cv-entry">
                  <span className="cv-entry-date">
                    {e.start_year ?? ''}
                    {e.end_year ? ` – ${e.end_year}` : ''}
                  </span>
                  <div className="cv-entry-title">
                    {e.degree_type}
                    {(isAr ? e.field_ar : e.field_en) ? ` — ${isAr ? e.field_ar : e.field_en}` : ''}
                  </div>
                  <div className="cv-entry-sub">
                    {isAr && e.institution_ar ? e.institution_ar : e.institution_en}
                    {e.country ? `, ${e.country}` : ''}
                  </div>
                  {e.thesis_title && (
                    <div style={{ fontSize: '9.5px', color: '#718096', fontStyle: 'italic' }}>
                      Thesis: {e.thesis_title}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {work.length > 0 && (
            <>
              <h2>{isAr ? 'الخبرات المهنية' : 'PROFESSIONAL EXPERIENCE'}</h2>
              {work.map((w) => (
                <div key={w.id} className="cv-entry">
                  <span className="cv-entry-date">
                    {w.start_date ?? '?'} –{' '}
                    {w.is_current ? (isAr ? 'حالياً' : 'Present') : (w.end_date ?? '')}
                  </span>
                  <div className="cv-entry-title">{(isAr && w.position_ar) || w.position_en}</div>
                  <div className="cv-entry-sub">
                    {(isAr && w.organization_ar) || w.organization_en}
                    {w.location ? ` — ${w.location}` : ''}
                  </div>
                </div>
              ))}
            </>
          )}

          {awards.length > 0 && (
            <>
              <h2>{isAr ? 'الجوائز والتكريمات' : 'AWARDS & HONORS'}</h2>
              {awards.map((a) => (
                <div key={a.id} className="cv-entry">
                  {a.year && <span className="cv-entry-date">{a.year}</span>}
                  <div className="cv-entry-title">{(isAr && a.name_ar) || a.name_en}</div>
                  {(isAr ? a.issuer_ar : a.issuer_en) && (
                    <div className="cv-entry-sub">{isAr ? a.issuer_ar : a.issuer_en}</div>
                  )}
                </div>
              ))}
            </>
          )}

          {projects.length > 0 && (
            <>
              <h2>{isAr ? 'المشاريع البحثية' : 'RESEARCH PROJECTS'}</h2>
              {projects.map((p) => (
                <div key={p.id} className="cv-entry">
                  <div className="cv-entry-title">{(isAr && p.title_ar) || p.title_en}</div>
                  <div className="cv-entry-sub">
                    {p.role ?? ''}
                    {p.funding_agency
                      ? ` — ${isAr ? 'تمويل' : 'Funded by'} ${p.funding_agency}`
                      : ''}
                  </div>
                </div>
              ))}
            </>
          )}

          {certifications.length > 0 && (
            <>
              <h2>{isAr ? 'الشهادات المهنية' : 'CERTIFICATIONS'}</h2>
              {certifications.map((c) => (
                <div key={c.id} className="cv-entry">
                  <div className="cv-entry-title">{(isAr && c.name_ar) || c.name_en}</div>
                  <div className="cv-entry-sub">
                    {c.issuing_org}
                    {c.issue_date ? ` — ${c.issue_date}` : ''}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Publications at the END */}
          {publications.length > 0 && (
            <>
              <h2>
                {isAr ? 'المنشورات البحثية' : 'PUBLICATIONS'} ({publications.length})
              </h2>
              <ol className="cv-pub-list">
                {publications.map((p) => (
                  <li key={p.id}>
                    <span style={{ fontWeight: 600 }}>{p.title}</span>
                    {p.journal_name && (
                      <span style={{ fontStyle: 'italic', color: '#4a5568' }}>
                        . {p.journal_name}
                      </span>
                    )}
                    {p.publication_year && (
                      <span style={{ color: '#718096' }}> ({p.publication_year})</span>
                    )}
                    {p.doi && (
                      <span style={{ color: '#a0aec0', fontSize: '9px' }}> doi:{p.doi}</span>
                    )}
                    {(p.scopus_citations ?? 0) > 0 && (
                      <span style={{ color: '#2b6cb0', fontWeight: 600, fontSize: '9px' }}>
                        {' '}
                        [{p.scopus_citations} citations]
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '8px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              fontSize: '8px',
              color: '#a0aec0',
            }}
          >
            {isAr
              ? `تم إنشاء هذه السيرة الذاتية تلقائياً من نظام معلومات الباحثين — الجامعة العراقية — ${new Date().toLocaleDateString('ar-IQ')}`
              : `Auto-generated from Researcher Information System — Al-Iraqia University — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            {' | '}ris.aliraqia.edu.iq
          </div>
        </div>
      </div>
    </>
  );
}
