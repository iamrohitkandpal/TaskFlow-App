import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartData } from "../assets/data";

const Chart = () => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart width={150} height={40} data={chartData}>
        <XAxis dataKey="name" stroke="#8884d8" />
        <YAxis dataKey="total" stroke="#8884d8" />
        <Tooltip />
        <Legend />
        <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Chart;
