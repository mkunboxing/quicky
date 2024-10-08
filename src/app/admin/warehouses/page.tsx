'use client';

import { Button } from '@/components/ui/button';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllWarehouses } from '@/http/api';
import { Warehouse } from '@/types';
import { DataTable } from '../_components/data-table';
import { columns } from './_components/columns';
import { useNewWarehouse } from '@/store/warehouse/warehouse-store';
import WarehouseSheet from './_components/warehouse-sheet';
import { Skeleton } from "@/components/ui/skeleton";

type SkeletonWarehouse = {
    id: number;
    name: React.ReactNode;
    pincode: React.ReactNode;
  };

  type WarehouseOrSkeleton = Warehouse | SkeletonWarehouse;

const WarehousesPage = () => {
    const { onOpen } = useNewWarehouse();

    const {
        data: warehouses,
        isError,
        isFetching,
    } = useQuery<Warehouse[]>({
        queryKey: ['warehouses'],
        queryFn: getAllWarehouses,
    });

      // Create skeleton data for loading state
  const skeletonData: SkeletonWarehouse[] = Array(2).fill({}).map((_, index) => ({
    id: index,
    name: <Skeleton className="h-4 w-[200px]" />,
    pincode: <Skeleton className="h-4 w-[100px]" />,
    // Add more fields as needed to match your Product type
  }));

  // Combine the products and skeleton data into a single array
  const tableData: WarehouseOrSkeleton[] = isFetching ? skeletonData : (warehouses || []);

    return (
      <>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight">Warehouses</h3>
          <Button size={"sm"} onClick={onOpen}>
            Add Warehouse
          </Button>
          <WarehouseSheet />
        </div>

        {isError && <span className="text-red-500">Something went wrong.</span>}

        <DataTable columns={columns} data={tableData} />
      </>
    );
};

export default WarehousesPage;