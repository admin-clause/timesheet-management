'use client';

import dynamic from 'next/dynamic';
import { TimesheetSkeleton } from './timesheet-skeleton';
import type { TimesheetFormProps } from '@/components/timesheet-form';

// Dynamically import the TimesheetForm component with SSR turned off.
// This is done inside a client component wrapper to comply with Next.js rules.
const TimesheetForm = dynamic<TimesheetFormProps>(
  () => import('@/components/timesheet-form').then((mod) => mod.TimesheetForm),
  {
    ssr: false,
    loading: () => <TimesheetSkeleton />,
  }
);

/**
 * This client component acts as a loader for the TimesheetForm,
 * allowing it to be dynamically imported with SSR disabled.
 */
export function TimesheetLoader(props: TimesheetFormProps) {
  return <TimesheetForm {...props} />;
}
