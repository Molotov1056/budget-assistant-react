// React Pie Chart Component
// This replaces your vanilla JS chart with a React component

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { CategoryTotals } from '../../types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  categoryTotals: CategoryTotals;
}

// Color mapping - same as your original app
const CATEGORY_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
  '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#795548',
  '#607D8B', '#3F51B5', '#CDDC39'
];

const PieChart: React.FC<PieChartProps> = ({ categoryTotals }) => {
  // Convert category totals to chart data
  const categories = Object.keys(categoryTotals);
  const totals = categories.map(cat => categoryTotals[cat].total);
  const counts = categories.map(cat => categoryTotals[cat].count);

  // No data state
  if (categories.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666',
        background: '#1a1a1a',
        borderRadius: '10px'
      }}>
        📊 No expenses to display<br />
        <small>Add some expenses to see the chart</small>
      </div>
    );
  }

  // Chart data configuration
  const data = {
    labels: categories.map(cat => `${cat} (${counts[categories.indexOf(cat)]})`),
    datasets: [
      {
        label: 'Spending by Category',
        data: totals,
        backgroundColor: categories.map((_, index) => 
          CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        ),
        borderColor: categories.map((_, index) => 
          CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        ),
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e0e0e0',
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#2d2d2d',
        titleColor: '#4CAF50',
        bodyColor: '#e0e0e0',
        borderColor: '#444',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const category = categories[context.dataIndex];
            const total = totals[context.dataIndex];
            const count = counts[context.dataIndex];
            const percentage = ((total / totals.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            
            return [
              `${category}: $${total.toFixed(2)}`,
              `${count} expense${count !== 1 ? 's' : ''}`,
              `${percentage}% of total`
            ];
          }
        }
      },
    },
  };

  return (
    <div style={{ height: '400px', background: '#1a1a1a', borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ color: '#4CAF50', marginBottom: '20px', textAlign: 'center' }}>
        📊 Expenses by Category
      </h3>
      <Pie data={data} options={options} />
    </div>
  );
};

export default PieChart;
