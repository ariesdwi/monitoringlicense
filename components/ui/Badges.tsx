'use client';

import { LicenseStatus } from '@/lib/mockData';

export function StatusBadge({ status }: { status: LicenseStatus | string }) {
  const map: Record<string, [string, string]> = {
    'PENDING':             ['badge-pending',   'PENDING'],
    'SUBMITTED_TO_CISO':   ['badge-ciso',      'SUBMITTED TO CISO'],
    'ACCOUNT_CREATED':     ['badge-available', 'ACCOUNT CREATED'],
    'ASSIGNED_TO_USER':    ['badge-active',    'ASSIGNED TO USER'],
    'IN_USE':              ['badge-done',      'IN USE'],
    'DONE':                ['badge-done',      'DONE'],
    'REVOKED':             ['badge-revoked',   'REVOKED'],
    'AVAILABLE':           ['badge-available', 'AVAILABLE'],
  };
  const [cls, label] = map[status] ?? ['badge-available', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function AppSquadTag({ departemen, aplikasi, squad }: { departemen: string; aplikasi: string; squad: string }) {
  const dot = 
    aplikasi === 'Qlola'   ? 'vdot-gem' : 
    aplikasi === 'BRIMo'   ? 'vdot-cl' :
    aplikasi === 'NDS'     ? 'vdot-gem' :
    'vdot-cl'; // Brispot
  return (
    <span className="vendor-tag">
      <span className={`vdot ${dot}`} />
      {departemen} / {aplikasi} / {squad}
    </span>
  );
}
