import { getTranslations } from 'next-intl/server';
import { Handshake, Award, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ITEMS = [
  { key: 'collaboration', Icon: Handshake },
  { key: 'excellence', Icon: Award },
  { key: 'innovation', Icon: Lightbulb },
] as const;

export async function Mission() {
  const t = await getTranslations('landing.mission');

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {ITEMS.map(({ key, Icon }) => (
            <Card key={key} className="text-center">
              <CardHeader className="items-center">
                <div className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-full">
                  <Icon className="size-6" />
                </div>
                <CardTitle className="mt-4 text-lg">{t(`items.${key}.title`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`items.${key}.body`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
