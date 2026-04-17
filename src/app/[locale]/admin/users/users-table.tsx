'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  isPublic: boolean;
  hasProfile: boolean;
  role: string | null;
  collegeName: string | null;
  createdAt: string;
  lastSignIn: string | null;
}

interface Props {
  users: UserRow[];
  locale: string;
}

export function UsersTable({ users, locale }: Props) {
  const isAr = locale === 'ar';

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-start font-medium">{isAr ? 'المستخدم' : 'User'}</th>
            <th className="px-4 py-2 text-start font-medium">{isAr ? 'البريد' : 'Email'}</th>
            <th className="px-4 py-2 text-start font-medium">{isAr ? 'الكلية' : 'College'}</th>
            <th className="px-4 py-2 text-start font-medium">{isAr ? 'الحالة' : 'Status'}</th>
            <th className="px-4 py-2 text-start font-medium">{isAr ? 'الدور' : 'Role'}</th>
            <th className="px-4 py-2 text-start font-medium">
              {isAr ? 'آخر دخول' : 'Last Sign-in'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                    <AvatarFallback className="text-[10px]">
                      {(u.fullName || u.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{u.fullName || '—'}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">{u.email}</td>
              <td className="px-4 py-2 text-xs text-muted-foreground">{u.collegeName ?? '—'}</td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  {u.hasProfile ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {isAr ? 'ملف شخصي' : 'Profile'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      {isAr ? 'بدون ملف' : 'No profile'}
                    </Badge>
                  )}
                  {u.isPublic ? (
                    <Badge variant="default" className="text-[10px]">
                      {isAr ? 'عام' : 'Public'}
                    </Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2">
                {u.role ? (
                  <Badge
                    variant={u.role === 'super_admin' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {u.role === 'super_admin'
                      ? isAr
                        ? 'مدير عام'
                        : 'Super Admin'
                      : u.role === 'college_admin'
                        ? isAr
                          ? 'مدير كلية'
                          : 'College Admin'
                        : isAr
                          ? 'مدير قسم'
                          : 'Dept Admin'}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {isAr ? 'باحث' : 'Researcher'}
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">
                {u.lastSignIn
                  ? new Date(u.lastSignIn).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
