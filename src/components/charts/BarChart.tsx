
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string[] | string;
            borderColor?: string[] | string;
            borderWidth?: number;
        }[];
    };
    options?: any;
}

export const BarChart: React.FC<BarChartProps> = ({ chartData, options: customOptions }) => {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                 callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: ${context.parsed.y} ms`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [5, 5],
                },
                ticks: {
                     callback: function(value: any) {
                        return value + ' ms'
                    }
                }
            },
        },
    };

    const options = { ...defaultOptions, ...customOptions };

    return <div style={{ height: '300px' }}><Bar options={options} data={chartData} /></div>;
};
