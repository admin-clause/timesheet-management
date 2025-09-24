'use client';

import dynamic from 'next/dynamic';

// Dynamically import the TimesheetForm component with SSR turned off.
// This is done inside a client component wrapper to comply with Next.js rules.
const TimesheetForm = dynamic(
  () => import('@/components/timesheet-form').then((mod) => mod.TimesheetForm),
  {
    ssr: false,
    loading: () => <p className="p-4">Loading timesheet...</p>,
  }
);

/**
 * This client component acts as a loader for the TimesheetForm,
 * allowing it to be dynamically imported with SSR disabled.
 */
export function TimesheetLoader() {
  return <TimesheetForm />;
}
