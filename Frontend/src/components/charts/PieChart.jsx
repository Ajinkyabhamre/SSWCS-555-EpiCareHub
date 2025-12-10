import { useMemo } from "react";

const PieChart = ({ data, title, description, height = 320 }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + (item.y || 0), 0);
    if (total === 0) return null;

    let currentAngle = -90; // Start from top
    const slices = data.map((item, index) => {
      const value = item.y || 0;
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate path for pie slice
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const radius = 100;
      const centerX = 120;
      const centerY = 120;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      // Calculate label position (middle of slice)
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelRadius = radius * 0.65;
      const labelX = centerX + labelRadius * Math.cos(midRad);
      const labelY = centerY + labelRadius * Math.sin(midRad);

      return {
        ...item,
        value,
        percentage: percentage.toFixed(1),
        labelX,
        labelY,
        path,
        index,
      };
    });

    return { slices, total };
  }, [data]);

  if (!chartData) {
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

  const colors = [
    { light: "#10b981", dark: "#10b981" }, // emerald-500
    { light: "#e5e7eb", dark: "#475569" }, // gray-200 / slate-600
  ];

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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 max-w-full">
          {/* Pie Chart SVG */}
          <div className="flex-shrink-0">
            <svg viewBox="0 0 240 240" className="w-56 h-56">
              {chartData.slices.map((slice, index) => {
                const color = colors[index % colors.length];
                return (
                  <g key={index} className="group cursor-pointer">
                    {/* Slice path - Light mode */}
                    <path
                      d={slice.path}
                      fill={color.light}
                      className="dark:hidden transition-opacity group-hover:opacity-80"
                    />
                    {/* Slice path - Dark mode */}
                    <path
                      d={slice.path}
                      fill={color.dark}
                      className="hidden dark:block transition-opacity group-hover:opacity-80"
                    />

                    {/* Label - only show if percentage is significant */}
                    {slice.percentage > 8 && (
                      <text
                        x={slice.labelX}
                        y={slice.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-bold fill-white pointer-events-none"
                      >
                        {slice.percentage}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            {chartData.slices.map((slice, index) => {
              const color = colors[index % colors.length];
              return (
                <div key={index} className="flex items-center gap-3">
                  {/* Color box - Light mode */}
                  <div
                    className="w-4 h-4 rounded dark:hidden"
                    style={{ backgroundColor: color.light }}
                  />
                  {/* Color box - Dark mode */}
                  <div
                    className="w-4 h-4 rounded hidden dark:block"
                    style={{ backgroundColor: color.dark }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {slice.x}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {slice.value} ({slice.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total: {chartData.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieChart;
