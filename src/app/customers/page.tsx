import prisma from '@/lib/prisma';
import CustomersClient from '@/components/customers/CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      shipments: {
        select: {
          id: true,
          shipmentNumber: true,
          totalExpected: true,
          deliveryStatus: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return <CustomersClient customers={customers} />;
}
