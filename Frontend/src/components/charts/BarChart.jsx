import { useMemo } from "react";

const BarChart = ({ data, xKey, yKey, title, description, height = 320 }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d[yKey] || 0);
    const maxValue = Math.max(...values, 1); // At least 1 to avoid division by zero

    return {
      items: data.map((d) => ({
        label: String(d[xKey] || ""),
        value: d[yKey] || 0,
        percentage: maxValue > 0 ? ((d[yKey] || 0) / maxValue) * 100 : 0,
      })),
      maxValue,
      yTicks: generateYTicks(maxValue),
    };
  }, [data, xKey, yKey]);

  function generateYTicks(max) {
    if (max === 0) return [0, 1, 2, 3, 4];
    const step = Math.ceil(max / 4);
    return Array.from({ length: 5 }, (_, i) => step * i);
  }

  if (!chartData || chartData.items.length === 0) {
    return (
      <div style={{ height: `${height}px` }} className="flex flex-col">
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            )}
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-500 dark:text-slate-400">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="flex flex-col">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Y-axis */}
        <div className="flex flex-col justify-between py-1 text-xs text-slate-600 dark:text-slate-400 min-w-[35px] text-right">
          {[...chartData.yTicks].reverse().map((tick, i) => (
            <div key={i}>{tick}</div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Grid and bars container */}
          <div className="flex-1 relative">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {chartData.yTicks.map((_, i) => (
                <div
                  key={i}
                  className="border-t border-slate-200 dark:border-slate-700 first:border-0"
                />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around gap-1 px-1 pb-1">
              {chartData.items.map((item, i) => {
                const barHeight = item.value > 0 ? Math.max(item.percentage, 2) : 0;
                return (
                  <div
                    key={i}
                    className="group relative flex-1 flex items-end justify-center max-w-[80px]"
                  >
                    {/* Tooltip */}
                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-emerald-300">{item.value}</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-500 dark:hover:to-emerald-400 transition-all duration-200 rounded-t-md cursor-pointer shadow-sm"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex items-start justify-around gap-1 mt-2 px-1">
            {chartData.items.map((item, i) => (
              <div
                key={i}
                className="flex-1 max-w-[80px] text-center text-xs text-slate-600 dark:text-slate-400 leading-tight"
              >
                <div className="truncate" title={item.label}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
