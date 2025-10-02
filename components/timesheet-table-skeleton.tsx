import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const weekdaySkeletons = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function TimesheetTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]"><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead className="w-[280px]"><Skeleton className="h-5 w-32" /></TableHead>
          {weekdaySkeletons.map(label => (
            <TableHead key={label} className="w-16 text-right">
              <Skeleton className="h-5 w-12" />
            </TableHead>
          ))}
          <TableHead className="w-[90px] text-right">
            <Skeleton className="h-5 w-20" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(3)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-10 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-10 w-full" />
            </TableCell>
            {weekdaySkeletons.map(label => (
              <TableCell key={label} className="w-16">
                <Skeleton className="h-10 w-full" />
              </TableCell>
            ))}
            <TableCell className="w-[90px]">
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-10 w-10" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>
            <Skeleton className="h-5 w-28" />
          </TableCell>
          {weekdaySkeletons.map(label => (
            <TableCell key={label} className="w-16 text-right">
              <Skeleton className="h-5 w-10" />
            </TableCell>
          ))}
          <TableCell className="w-[90px] text-right">
            <Skeleton className="h-6 w-16" />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
