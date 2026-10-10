import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BatchDetailClient from './BatchDetailClient';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      recipe: true,
      logs: {
        orderBy: { stageNumber: 'asc' },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  return <BatchDetailClient batch={batch} />;
}
