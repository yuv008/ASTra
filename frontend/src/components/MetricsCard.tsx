import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

function MetricsCard({ title, value, subtitle, icon, color }: MetricsCardProps) {
  const colorClasses = {
    green: 'bg-green-900/50 border-green-500 text-green-400',
    yellow: 'bg-yellow-900/50 border-yellow-500 text-yellow-400',
    red: 'bg-red-900/50 border-red-500 text-red-400',
    blue: 'bg-blue-900/50 border-blue-500 text-blue-400',
  };

  const iconColorClasses = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`rounded-lg border-l-4 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className={iconColorClasses[color]}>{icon}</div>
      </div>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

export default MetricsCard;
