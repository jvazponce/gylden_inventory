import prisma from '@/lib/prisma';
import NewShipmentClient from './NewShipmentClient';

export const dynamic = 'force-dynamic';

export default async function NewShipmentPage() {
  const [customers, finishedGoods, count] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
    prisma.finishedGood.findMany({ orderBy: { name: 'asc' } }),
    prisma.shipment.count(),
  ]);

  const year = new Date().getFullYear();
  const suggestedShipmentNumber = `ENV-${year}-${String(count + 1).padStart(3, '0')}`;

  return (
    <NewShipmentClient
      customers={customers}
      finishedGoods={finishedGoods}
      suggestedShipmentNumber={suggestedShipmentNumber}
    />
  );
}
