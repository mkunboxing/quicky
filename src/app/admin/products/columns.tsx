import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Product } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Define the SkeletonProduct type
type SkeletonProduct = {
  id: number;
  name: React.ReactNode;
  price: React.ReactNode;
  // Add other fields as needed
}

// Create a union type for Product or SkeletonProduct
type ProductOrSkeleton = Product | SkeletonProduct

export const columns: ColumnDef<ProductOrSkeleton>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const value = row.original.name;
            return typeof value === "string" ? value : value;
        },
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const value = row.original.price;
            return typeof value === "number" ? `${value.toFixed(2)}` : value;
        },
    },
    {
        id: "actions",
        header: "Action",
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
        }
    },
]