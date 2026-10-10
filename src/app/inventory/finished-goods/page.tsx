import prisma from '@/lib/prisma';
import FinishedGoodsClient from '@/components/finished-goods/FinishedGoodsClient';

export const dynamic = 'force-dynamic';

export default async function FinishedGoodsPage() {
  const items = await prisma.finishedGood.findMany({
    orderBy: { name: 'asc' },
  });

  return <FinishedGoodsClient items={items} />;
}
