import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  FlaskConical, 
  Plus, 
  Clock, 
  Layers, 
  ArrowRight,
  Beer,
  Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      items: {
        include: {
          rawMaterial: true,
        },
      },
      batches: {
        where: { status: 'IN_PROGRESS' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-600" />
            Recetas y Formulaciones Base
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulaciones maestras calculadas para un lote base de 20 L con escalado automático para cualquier volumen.
          </p>
        </div>

        <div>
          <Link
            href="/recipes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Receta
          </Link>
        </div>
      </div>

      {/* Grid of Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe) => {
          const activeBatchesCount = recipe.batches.length;
          return (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                      Base: {recipe.baseVolumeLiters} Litros
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{recipe.name}</h3>
                  </div>

                  {activeBatchesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Beer className="w-3 h-3" />
                      {activeBatchesCount} lote(s) en curso
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {recipe.description || 'Sin descripción adicional para esta receta.'}
                </p>

                {/* Recipe Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>~{recipe.estimatedDays} días estimados</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>{recipe.items.length} materias primas</span>
                  </div>
                </div>

                {/* Sample items pill preview */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                  {recipe.items.slice(0, 4).map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                    >
                      {item.rawMaterial.name} ({item.quantity} {item.rawMaterial.unit})
                    </span>
                  ))}
                  {recipe.items.length > 4 && (
                    <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                      +{recipe.items.length - 4} más
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  <span>Ver Formulación & Escalador</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/batches/new?recipeId=${recipe.id}`}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Beer className="w-3.5 h-3.5" />
                  Lanzar Batch
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
