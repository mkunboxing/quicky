import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Warehouse } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"

type SkeletonWarehouse = {
    id: number;
    name: React.ReactNode;
    pincode: React.ReactNode;
  }

type ProductOrSkeleton = Warehouse | SkeletonWarehouse

export const columns: ColumnDef<ProductOrSkeleton>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {  // this  is to show skeleton if data is loading
            const value = row.original.name;
            return typeof value === "string" ? value : value;
        },
    },
    {
        accessorKey: 'pincode',
        header: 'Pincode',
        cell: ({ row }) => { // this  is to show skeleton if data is loading
            const value = row.original.pincode;
            return typeof value === "number" ? `${value.toFixed(2)}` : value;
        },
    },
    {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
            if ('id' in row.original && typeof row.original.id === 'number') {
                return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(row.original.id.toString())}
                        >
                          Copy product ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View product details</DropdownMenuItem>
                        <DropdownMenuItem>Edit product</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )
            } else {
                return <Skeleton className="h-8 w-8" />;
            }
        },
    },
];