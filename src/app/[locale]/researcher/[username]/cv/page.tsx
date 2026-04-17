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

  const PRIMARY = '#1a365d';
  const ACCENT = '#2b6cb0';
  const LIGHT = '#ebf4ff';

  return (
    <html lang={locale} dir={isAr ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <title>CV — {name}</title>
        <style>{`
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: ${isAr ? "'Cairo', 'Segoe UI'" : "'Inter', 'Segoe UI'"}, system-ui, sans-serif; font-size: 10.5px; line-height: 1.55; color: #1a202c; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; overflow: hidden; }
          .sidebar { position: absolute; top: 0; ${isAr ? 'right' : 'left'}: 0; width: 68mm; min-height: 297mm; background: ${PRIMARY}; color: white; padding: 20mm 5mm 15mm; }
          .main { margin-${isAr ? 'right' : 'left'}: 68mm; padding: 12mm 10mm 15mm; min-height: 297mm; }
          .sidebar h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.6); margin: 14px 0 6px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 3px; }
          .sidebar .item { margin-bottom: 5px; font-size: 10px; }
          .sidebar .item-label { color: rgba(255,255,255,0.7); font-size: 9px; }
          .sidebar a { color: #90cdf4; text-decoration: none; font-size: 9px; word-break: break-all; }
          .main h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${PRIMARY}; border-bottom: 2px solid ${PRIMARY}; padding-bottom: 3px; margin: 16px 0 8px; }
          .main h2:first-child { margin-top: 0; }
          .entry { margin-bottom: 7px; }
          .entry-title { font-weight: 600; font-size: 10.5px; }
          .entry-sub { color: #4a5568; font-size: 10px; }
          .entry-date { color: #718096; font-size: 9.5px; float: ${isAr ? 'left' : 'right'}; }
          .pub-list { counter-reset: pub; list-style: none; padding: 0; }
          .pub-list li { counter-increment: pub; margin-bottom: 5px; padding-${isAr ? 'right' : 'left'}: 22px; position: relative; font-size: 10px; }
          .pub-list li::before { content: counter(pub) "."; position: absolute; ${isAr ? 'right' : 'left'}: 0; color: ${ACCENT}; font-weight: 700; font-size: 10px; }
          .pub-journal { font-style: italic; color: #4a5568; }
          .pub-year { color: #718096; }
          .pub-citations { color: ${ACCENT}; font-weight: 600; font-size: 9px; }
          .metric-box { background: rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; text-align: center; margin-bottom: 4px; }
          .metric-val { font-size: 20px; font-weight: 800; }
          .metric-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); }
          .skill-bar { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; margin-top: 2px; }
          .skill-fill { height: 100%; background: #90cdf4; border-radius: 2px; }
          .avatar-circle { width: 90px; height: 90px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); object-fit: cover; display: block; margin: 0 auto 10px; }
          .no-print { position: fixed; top: 0; left: 0; right: 0; z-index: 999; background: #2d3748; color: white; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; }
          .no-print button { background: white; color: #2d3748; border: none; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
          @media print { .no-print { display: none !important; } .page { margin: 0; } }
          @media screen { .page { margin: 20px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15); } body { background: #e2e8f0; padding-top: 50px; } }
        `}</style>
      </head>
      <body>
        <div className="no-print">
          <span style={{ fontSize: '13px' }}>
            {isAr ? 'السيرة الذاتية — Ctrl+P للحفظ كـ PDF' : 'CV — Press Ctrl+P to save as PDF'}
          </span>
          <button id="print-btn">{isAr ? '⬇ حفظ PDF' : '⬇ Save PDF'}</button>
          <script
            dangerouslySetInnerHTML={{
              __html:
                'document.getElementById("print-btn")?.addEventListener("click",()=>window.print())',
            }}
          />
        </div>

        <div className="page">
          {/* ===== SIDEBAR ===== */}
          <div className="sidebar">
            {/* Avatar */}
            {profile.profile_image ? (
              <img src={profile.profile_image} alt="" className="avatar-circle" />
            ) : (
              <div
                className="avatar-circle"
                style={{
                  background: ACCENT,
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

            {/* Metrics */}
            {hIndex > 0 || totalPubs > 0 ? (
              <div>
                <h3>{isAr ? 'المؤشرات' : 'METRICS'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {hIndex > 0 ? (
                    <div className="metric-box">
                      <div className="metric-val">{hIndex}</div>
                      <div className="metric-label">h-index</div>
                    </div>
                  ) : null}
                  {totalPubs > 0 ? (
                    <div className="metric-box">
                      <div className="metric-val">{totalPubs}</div>
                      <div className="metric-label">{isAr ? 'منشور' : 'Pubs'}</div>
                    </div>
                  ) : null}
                  {totalCitations > 0 ? (
                    <div className="metric-box">
                      <div className="metric-val">
                        {totalCitations > 999
                          ? `${(totalCitations / 1000).toFixed(1)}k`
                          : totalCitations}
                      </div>
                      <div className="metric-label">{isAr ? 'اقتباس' : 'Citations'}</div>
                    </div>
                  ) : null}
                  {publications.length > 0 ? (
                    <div className="metric-box">
                      <div className="metric-val">
                        {publications.filter((p) => p.is_open_access).length}
                      </div>
                      <div className="metric-label">Open Access</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Contact */}
            <h3>{isAr ? 'التواصل' : 'CONTACT'}</h3>
            {profile.public_email ? (
              <div className="item">
                <div className="item-label">{isAr ? 'البريد' : 'Email'}</div>
                <div>{profile.public_email}</div>
              </div>
            ) : null}
            {profile.public_phone ? (
              <div className="item">
                <div className="item-label">{isAr ? 'الهاتف' : 'Phone'}</div>
                <div>{profile.public_phone}</div>
              </div>
            ) : null}
            {profile.website ? (
              <div className="item">
                <div className="item-label">{isAr ? 'الموقع' : 'Website'}</div>
                <a href={profile.website}>{profile.website.replace('https://', '')}</a>
              </div>
            ) : null}

            {/* Research Profiles */}
            {orcidUrl || scopusUrl || scholarUrl || linkedinUrl ? (
              <>
                <h3>{isAr ? 'الملفات البحثية' : 'PROFILES'}</h3>
                {orcidUrl ? (
                  <div className="item">
                    <a href={orcidUrl}>ORCID</a>
                  </div>
                ) : null}
                {scopusUrl ? (
                  <div className="item">
                    <a href={scopusUrl}>Scopus</a>
                  </div>
                ) : null}
                {scholarUrl ? (
                  <div className="item">
                    <a href={scholarUrl}>Google Scholar</a>
                  </div>
                ) : null}
                {linkedinUrl ? (
                  <div className="item">
                    <a href={linkedinUrl}>LinkedIn</a>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* Skills */}
            {skills.length > 0 ? (
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
                        {s.proficiency ? (
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px' }}>
                            {s.proficiency}
                          </span>
                        ) : null}
                      </div>
                      <div className="skill-bar">
                        <div className="skill-fill" style={{ width: `${level}%` }} />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : null}

            {/* Languages */}
            {languages.length > 0 ? (
              <>
                <h3>{isAr ? 'اللغات' : 'LANGUAGES'}</h3>
                {languages.map((l) => (
                  <div key={l.id} className="item">
                    {l.language_name}{' '}
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
                      ({l.proficiency})
                    </span>
                  </div>
                ))}
              </>
            ) : null}
          </div>

          {/* ===== MAIN CONTENT ===== */}
          <div className="main">
            {/* Header */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h1
                    style={{ fontSize: '22px', fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}
                  >
                    {name}
                  </h1>
                  {titleName ? (
                    <div
                      style={{ fontSize: '12px', color: ACCENT, fontWeight: 600, marginTop: '2px' }}
                    >
                      {titleName}
                    </div>
                  ) : null}
                  <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                    {[deptName, collegeName, isAr ? 'جامعة التراث' : 'AL-Turath University']
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    style={{ height: '35px', objectFit: 'contain', opacity: 0.8 }}
                  />
                ) : null}
              </div>
            </div>

            {/* Bio */}
            {bio ? (
              <>
                <h2>{isAr ? 'نبذة مختصرة' : 'ABOUT'}</h2>
                <p style={{ whiteSpace: 'pre-line', color: '#2d3748' }}>{bio}</p>
              </>
            ) : null}

            {/* Research Interests */}
            {interests ? (
              <>
                <h2>{isAr ? 'الاهتمامات البحثية' : 'RESEARCH INTERESTS'}</h2>
                <p style={{ color: '#2d3748' }}>{interests}</p>
              </>
            ) : null}

            {/* Education */}
            {education.length > 0 ? (
              <>
                <h2>{isAr ? 'التحصيل الدراسي' : 'EDUCATION'}</h2>
                {education.map((e) => (
                  <div key={e.id} className="entry">
                    <span className="entry-date">
                      {e.start_year ?? ''}
                      {e.end_year ? ` – ${e.end_year}` : ''}
                    </span>
                    <div className="entry-title">
                      {e.degree_type}
                      {(isAr ? e.field_ar : e.field_en)
                        ? ` — ${isAr ? e.field_ar : e.field_en}`
                        : ''}
                    </div>
                    <div className="entry-sub">
                      {isAr && e.institution_ar ? e.institution_ar : e.institution_en}
                      {e.country ? `, ${e.country}` : ''}
                    </div>
                    {e.thesis_title ? (
                      <div style={{ fontSize: '9.5px', color: '#718096', fontStyle: 'italic' }}>
                        Thesis: {e.thesis_title}
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            ) : null}

            {/* Work Experience */}
            {work.length > 0 ? (
              <>
                <h2>{isAr ? 'الخبرات المهنية' : 'PROFESSIONAL EXPERIENCE'}</h2>
                {work.map((w) => (
                  <div key={w.id} className="entry">
                    <span className="entry-date">
                      {w.start_date ?? '?'} –{' '}
                      {w.is_current ? (isAr ? 'حالياً' : 'Present') : (w.end_date ?? '')}
                    </span>
                    <div className="entry-title">{(isAr && w.position_ar) || w.position_en}</div>
                    <div className="entry-sub">
                      {(isAr && w.organization_ar) || w.organization_en}
                      {w.location ? ` — ${w.location}` : ''}
                    </div>
                  </div>
                ))}
              </>
            ) : null}

            {/* Publications */}
            {publications.length > 0 ? (
              <>
                <h2>
                  {isAr ? 'المنشورات البحثية' : 'PUBLICATIONS'} ({publications.length})
                </h2>
                <ol className="pub-list">
                  {publications.map((p) => (
                    <li key={p.id}>
                      <span style={{ fontWeight: 600 }}>{p.title}</span>
                      {p.journal_name ? (
                        <span className="pub-journal">. {p.journal_name}</span>
                      ) : null}
                      {p.publication_year ? (
                        <span className="pub-year"> ({p.publication_year})</span>
                      ) : null}
                      {p.doi ? (
                        <span style={{ color: '#a0aec0', fontSize: '9px' }}> doi:{p.doi}</span>
                      ) : null}
                      {(p.scopus_citations ?? 0) > 0 ? (
                        <span className="pub-citations"> [{p.scopus_citations} citations]</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}

            {/* Awards */}
            {awards.length > 0 ? (
              <>
                <h2>{isAr ? 'الجوائز والتكريمات' : 'AWARDS & HONORS'}</h2>
                {awards.map((a) => (
                  <div key={a.id} className="entry">
                    {a.year ? <span className="entry-date">{a.year}</span> : null}
                    <div className="entry-title">{(isAr && a.name_ar) || a.name_en}</div>
                    {(isAr ? a.issuer_ar : a.issuer_en) ? (
                      <div className="entry-sub">{isAr ? a.issuer_ar : a.issuer_en}</div>
                    ) : null}
                  </div>
                ))}
              </>
            ) : null}

            {/* Projects */}
            {projects.length > 0 ? (
              <>
                <h2>{isAr ? 'المشاريع البحثية' : 'RESEARCH PROJECTS'}</h2>
                {projects.map((p) => (
                  <div key={p.id} className="entry">
                    <div className="entry-title">{(isAr && p.title_ar) || p.title_en}</div>
                    <div className="entry-sub">
                      {p.role ? `${p.role}` : ''}
                      {p.funding_agency
                        ? ` — ${isAr ? 'تمويل' : 'Funded by'} ${p.funding_agency}`
                        : ''}
                    </div>
                  </div>
                ))}
              </>
            ) : null}

            {/* Certifications */}
            {certifications.length > 0 ? (
              <>
                <h2>{isAr ? 'الشهادات المهنية' : 'CERTIFICATIONS'}</h2>
                {certifications.map((c) => (
                  <div key={c.id} className="entry">
                    <div className="entry-title">{(isAr && c.name_ar) || c.name_en}</div>
                    <div className="entry-sub">
                      {c.issuing_org}
                      {c.issue_date ? ` — ${c.issue_date}` : ''}
                    </div>
                  </div>
                ))}
              </>
            ) : null}

            {/* Footer */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '8px',
                borderTop: `1px solid #e2e8f0`,
                textAlign: 'center',
                fontSize: '8px',
                color: '#a0aec0',
              }}
            >
              {isAr
                ? `تم إنشاء هذه السيرة الذاتية تلقائياً من نظام معلومات الباحثين — جامعة التراث — ${new Date().toLocaleDateString('ar-IQ')}`
                : `Auto-generated from Researcher Information System — AL-Turath University — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              {' | '}ris.uoturath.edu.iq
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
