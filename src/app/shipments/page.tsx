import prisma from '@/lib/prisma';
import ShipmentsListClient from '@/components/shipments/ShipmentsListClient';

export const dynamic = 'force-dynamic';

export default async function ShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    include: {
      customer: true,
      items: {
        include: {
          finishedGood: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <ShipmentsListClient shipments={shipments} />;
}
