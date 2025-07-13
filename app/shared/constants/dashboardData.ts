import { Section, SidebarSection, DashboardBlocks } from "../types/dashboard";

export const sections: Section[] = [
  { id: "overview", name: "Overview", icon: "📊" },
  { id: "cloud", name: "Cloud Usage", icon: "☁️" },
  { id: "sales", name: "Sales", icon: "💰" },
  { id: "workers", name: "Workers", icon: "👥" },
  { id: "projects", name: "Projects", icon: "📋" },
  { id: "finance", name: "Finance", icon: "💳" },
];

export const sidebarItems: SidebarSection[] = [
  {
    title: "Views",
    items: [
      { name: "All", count: 135, icon: "📋" },
      { name: "Assigned to me", count: 120, icon: "👤" },
      { name: "Today", count: 5, icon: "📅" },
      { name: "Checklists & Items", count: 5, icon: "✅" },
      { name: "Recently completed", count: 8, icon: "✅" },
      { name: "Expired", count: 2, icon: "⏰" },
      { name: "Archived", count: 1398, icon: "📦" },
    ],
  },
  {
    title: "Projects",
    items: [
      {
        name: "Design",
        icon: "🎨",
        expanded: true,
        subitems: [
          { name: "3D", icon: "🎲" },
          { name: "UX/UI", icon: "🎭", count: 10 },
        ],
      },
      { name: "Web development", icon: "💻", count: 0 },
      { name: "Finances", icon: "💰", count: 2 },
      { name: "HR", icon: "👥", count: 0 },
    ],
  },
  {
    title: "Teams",
    items: [
      { name: "Designers", icon: "🎨" },
      { name: "Dev", icon: "💻" },
      { name: "QA", icon: "🔍", count: 3 },
    ],
  },
];

export const dashboardBlocks: DashboardBlocks = {
  overview: [
    {
      id: "net-sales",
      type: "metric",
      title: "Net Sales",
      value: "$887",
      change: "-71.54%",
      changeType: "negative",
      period: "vs previous month",
    },
    {
      id: "gross-margin",
      type: "chart",
      title: "Gross Margin",
      chartType: "bar",
    },
    {
      id: "expenses",
      type: "pie",
      title: "Expenses",
      data: [
        { name: "Cost of Goods Sold", value: 60.6, color: "#22d3ee" },
        { name: "Finance Expense", value: 29.8, color: "#fbbf24" },
        { name: "Total Operating Costs", value: 9.6, color: "#34d399" },
      ],
    },
    {
      id: "net-profit",
      type: "line",
      title: "Net Profit",
      forecast: "$100.24",
    },
    {
      id: "expenses-income",
      type: "comparison",
      title: "Expenses vs Income",
    },
  ],
  cloud: [
    {
      id: "cloud-costs",
      type: "metric",
      title: "Monthly Cloud Costs",
      value: "$15,432",
      change: "+12.3%",
      changeType: "negative",
    },
    {
      id: "resource-usage",
      type: "chart",
      title: "Resource Usage",
      chartType: "area",
    },
  ],
  sales: [
    {
      id: "total-revenue",
      type: "metric",
      title: "Total Revenue",
      value: "$45,239",
      change: "+8.2%",
      changeType: "positive",
    },
    {
      id: "sales-pipeline",
      type: "chart",
      title: "Sales Pipeline",
      chartType: "funnel",
    },
  ],
  workers: [
    {
      id: "active-users",
      type: "metric",
      title: "Active Users",
      value: "1,234",
      change: "+5.7%",
      changeType: "positive",
    },
    {
      id: "team-performance",
      type: "chart",
      title: "Team Performance",
      chartType: "radar",
    },
  ],
};
