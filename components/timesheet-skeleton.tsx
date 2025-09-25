import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";

export function TimesheetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]"><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
            <TableHead className="text-right font-bold"><Skeleton className="h-5 w-28" /></TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-full" /></TableCell>
              <TableCell><Skeleton className="h-10 w-12" /></TableCell>
              <TableCell><Skeleton className="h-10 w-10" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <Skeleton className="h-10 w-24" />

      <div className="flex justify-between items-start gap-6 pt-6">
        <div className="w-1/3 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
        </div>

        <div className="flex flex-col items-end">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-12 w-36 mt-4" />
        </div>
      </div>
    </div>
  );
}
