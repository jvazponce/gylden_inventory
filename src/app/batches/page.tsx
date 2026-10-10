import prisma from '@/lib/prisma';
import BatchesListClient from './BatchesListClient';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    include: {
      recipe: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <BatchesListClient batches={batches} />;
}
