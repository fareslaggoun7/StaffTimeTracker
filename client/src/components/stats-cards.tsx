import { CheckCircle, Clock, AlertTriangle, List } from 'lucide-react';
import { ProcessingStats } from '@shared/schema';

interface StatsCardsProps {
  stats: ProcessingStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Matched',
      value: stats.matched,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      textColor: 'text-green-700',
      valueColor: 'text-green-900',
    },
    {
      title: 'Late',
      value: stats.late,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-700',
      valueColor: 'text-yellow-900',
    },
    {
      title: 'Unmatched',
      value: stats.unmatched,
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
      textColor: 'text-red-700',
      valueColor: 'text-red-900',
    },
    {
      title: 'Total Records',
      value: stats.total,
      icon: List,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-500',
      textColor: 'text-gray-700',
      valueColor: 'text-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className={`${card.bgColor} p-4 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.valueColor}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <Icon className={`${card.iconColor} w-8 h-8`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
