
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            fill: boolean;
            tension: number;
        }[];
    };
}

export const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: '#1f2937',
                titleColor: '#f9fafb',
                bodyColor: '#f9fafb',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6b7280',
                },
            },
            y: {
                grid: {
                    color: '#e5e7eb',
                    borderDash: [5, 5],
                },
                ticks: {
                    color: '#6b7280',
                    callback: function(value: string | number) {
                        if (typeof value === 'number' && value >= 1000) {
                            return (value / 1000) + 'k';
                        }
                        return value;
                    }
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return <div style={{ height: '300px' }}><Line options={options} data={chartData} /></div>;
};
