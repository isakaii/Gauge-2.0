"use client"

import { useState } from "react"
import { ArrowDown, Calendar, Mail, Users, Linkedin, BarChart3, TrendingUp, Building, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { outreachData } from "@/data/outreach"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "@/components/ui/chart"
import { Sidebar } from "@/components/sidebar"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last30days")

  // Calculate key metrics
  const totalOutreach = outreachData.length
  const responded = outreachData.filter((item) => item.status === "responded").length
  const interviewed = outreachData.filter((item) => item.status === "interviewed").length
  const offered = outreachData.filter((item) => item.status === "offered").length
  const hired = outreachData.filter((item) => item.status === "hired").length

  const responseRate = Math.round((responded / totalOutreach) * 100)
  const interviewRate = Math.round((interviewed / responded) * 100)
  const offerRate = Math.round((offered / interviewed) * 100)
  const hireRate = Math.round((hired / offered) * 100)
  const conversionRate = Math.round((hired / totalOutreach) * 100)

  // Calculate metrics by outreach type
  const emailOutreach = outreachData.filter((item) => item.outreach_type === "email").length
  const linkedinOutreach = outreachData.filter((item) => item.outreach_type === "linkedin").length

  const emailResponded = outreachData.filter(
    (item) => item.outreach_type === "email" && item.status === "responded",
  ).length
  const linkedinResponded = outreachData.filter(
    (item) => item.outreach_type === "linkedin" && item.status === "responded",
  ).length

  const emailResponseRate = Math.round((emailResponded / emailOutreach) * 100)
  const linkedinResponseRate = Math.round((linkedinResponded / linkedinOutreach) * 100)

  // Data for conversion funnel
  const funnelData = [
    { name: "Outreach", value: totalOutreach },
    { name: "Responded", value: responded },
    { name: "Interviewed", value: interviewed },
    { name: "Offered", value: offered },
    { name: "Hired", value: hired },
  ]

  // Data for outreach by company
  const outreachByCompany = [
    { name: "TechVision AI", value: 28 },
    { name: "CloudScale", value: 35 },
    { name: "DataSphere", value: 15 },
    { name: "FinEdge", value: 42 },
    { name: "RoboLogic", value: 12 },
  ]

  // Data for outreach over time
  const outreachOverTime = [
    { name: "Jan", outreach: 45, responses: 22, hires: 3 },
    { name: "Feb", outreach: 52, responses: 28, hires: 4 },
    { name: "Mar", outreach: 48, responses: 25, hires: 5 },
    { name: "Apr", outreach: 61, responses: 35, hires: 6 },
    { name: "May", outreach: 58, responses: 32, hires: 4 },
    { name: "Jun", outreach: 65, responses: 40, hires: 7 },
  ]

  // Data for response time
  const responseTimeData = [
    { name: "Same day", value: 25 },
    { name: "1-2 days", value: 35 },
    { name: "3-7 days", value: 20 },
    { name: "1-2 weeks", value: 15 },
    { name: "Over 2 weeks", value: 5 },
  ]

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Outreach Analytics</h1>
            <div className="flex items-center gap-2">
            </div>
        </header>

        <div className="p-4 flex-1 overflow-auto">
            <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversion">Conversion</TabsTrigger>
                <TabsTrigger value="companies">Companies</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Outreach</CardTitle>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{totalOutreach}</div>
                    <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{responseRate}%</div>
                    <p className="text-xs text-muted-foreground">+3.2% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">+1.8% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">2.4 days</div>
                    <p className="text-xs text-muted-foreground">-0.5 days from last month</p>
                    </CardContent>
                </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                    <CardTitle>Outreach by Type</CardTitle>
                    <CardDescription>Email vs LinkedIn outreach effectiveness</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                            { name: "Email", sent: emailOutreach, responded: emailResponded },
                            { name: "LinkedIn", sent: linkedinOutreach, responded: linkedinResponded },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                            <Bar dataKey="responded" fill="#82ca9d" name="Responded" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Email Response Rate</div>
                        <div className="font-medium text-lg">{emailResponseRate}%</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">LinkedIn Response Rate</div>
                        <div className="font-medium text-lg">{linkedinResponseRate}%</div>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                    <CardTitle>Response Time Distribution</CardTitle>
                    <CardDescription>How quickly candidates respond to outreach</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={responseTimeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            >
                            {responseTimeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-sm text-center text-gray-500">
                        Average response time: <span className="font-medium">2.4 days</span>
                    </div>
                    </CardContent>
                </Card>
                </div>

                <Card>
                <CardHeader>
                    <CardTitle>Recent Outreach Activity</CardTitle>
                    <CardDescription>Latest outreach and responses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-sm">
                        <tr>
                            <th className="p-3 font-medium">Candidate</th>
                            <th className="p-3 font-medium">Company</th>
                            <th className="p-3 font-medium">Outreach Date</th>
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {outreachData.slice(0, 5).map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 font-medium">{item.candidate_name}</td>
                            <td className="p-3">{item.company}</td>
                            <td className="p-3">{new Date(item.outreach_date).toLocaleDateString()}</td>
                            <td className="p-3">
                                {item.outreach_type === "email" ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Mail className="h-3 w-3 mr-1" /> Email
                                </Badge>
                                ) : (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                                </Badge>
                                )}
                            </td>
                            <td className="p-3">
                                <StatusBadge status={item.status} />
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{responseRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {responded} of {totalOutreach} candidates responded
                    </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{interviewRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {interviewed} of {responded} respondents interviewed
                    </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{offerRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {offered} of {interviewed} interviewees received offers
                    </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{hireRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {hired} of {offered} offers accepted
                    </p>
                    </CardContent>
                </Card>
                </div>

                <Card>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>Candidate journey from outreach to hire</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid grid-cols-5 gap-2">
                    <div className="text-center">
                        <div className="text-sm font-medium">Outreach</div>
                        <div className="text-2xl font-bold">{totalOutreach}</div>
                        <div className="text-xs text-gray-500">100%</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <ArrowRight />
                        <div className="text-sm font-medium">Responded</div>
                        <div className="text-2xl font-bold">{responded}</div>
                        <div className="text-xs text-gray-500">{responseRate}%</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <ArrowRight />
                        <div className="text-sm font-medium">Interviewed</div>
                        <div className="text-2xl font-bold">{interviewed}</div>
                        <div className="text-xs text-gray-500">{Math.round((interviewed / totalOutreach) * 100)}%</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <ArrowRight />
                        <div className="text-sm font-medium">Offered</div>
                        <div className="text-2xl font-bold">{offered}</div>
                        <div className="text-xs text-gray-500">{Math.round((offered / totalOutreach) * 100)}%</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <ArrowRight />
                        <div className="text-sm font-medium">Hired</div>
                        <div className="text-2xl font-bold">{hired}</div>
                        <div className="text-xs text-gray-500">{conversionRate}%</div>
                    </div>
                    </div>
                </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Conversion by Outreach Type</CardTitle>
                    <CardDescription>Email vs LinkedIn effectiveness</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                            {
                                name: "Email",
                                responseRate: emailResponseRate,
                                interviewRate: 42,
                                hireRate: 8,
                            },
                            {
                                name: "LinkedIn",
                                responseRate: linkedinResponseRate,
                                interviewRate: 38,
                                hireRate: 6,
                            },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="responseRate" fill="#8884d8" name="Response Rate %" />
                            <Bar dataKey="interviewRate" fill="#82ca9d" name="Interview Rate %" />
                            <Bar dataKey="hireRate" fill="#ffc658" name="Hire Rate %" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Conversion by Role Type</CardTitle>
                    <CardDescription>Effectiveness across different roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                            { name: "Engineering", responseRate: 58, interviewRate: 45, hireRate: 12 },
                            { name: "Product", responseRate: 62, interviewRate: 48, hireRate: 15 },
                            { name: "Design", responseRate: 55, interviewRate: 40, hireRate: 10 },
                            { name: "Marketing", responseRate: 65, interviewRate: 42, hireRate: 8 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="responseRate" fill="#8884d8" name="Response Rate %" />
                            <Bar dataKey="interviewRate" fill="#82ca9d" name="Interview Rate %" />
                            <Bar dataKey="hireRate" fill="#ffc658" name="Hire Rate %" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>
                </div>
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Companies Targeted</CardTitle>
                    <Building className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">+3 from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Candidates per Company</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">18.5</div>
                    <p className="text-xs text-muted-foreground">+2.3 from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Best Performing Company</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">FinEdge</div>
                    <p className="text-xs text-muted-foreground">18% conversion rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Worst Performing Company</CardTitle>
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">RoboLogic</div>
                    <p className="text-xs text-muted-foreground">4% conversion rate</p>
                    </CardContent>
                </Card>
                </div>

                <Card>
                <CardHeader>
                    <CardTitle>Outreach by Company</CardTitle>
                    <CardDescription>Number of candidates contacted per company</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={outreachByCompany} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Candidates" />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Conversion Rate by Company</CardTitle>
                    <CardDescription>Percentage of outreach that converted to hires</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                            { name: "TechVision AI", value: 12 },
                            { name: "CloudScale", value: 8 },
                            { name: "DataSphere", value: 15 },
                            { name: "FinEdge", value: 18 },
                            { name: "RoboLogic", value: 4 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#82ca9d" name="Conversion Rate %" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Response Time by Company</CardTitle>
                    <CardDescription>Average days to respond by company</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                            { name: "TechVision AI", value: 1.8 },
                            { name: "CloudScale", value: 3.2 },
                            { name: "DataSphere", value: 2.5 },
                            { name: "FinEdge", value: 1.2 },
                            { name: "RoboLogic", value: 4.5 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#ffc658" name="Days to Respond" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>
                </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
                <Card>
                <CardHeader>
                    <CardTitle>Outreach Over Time</CardTitle>
                    <CardDescription>Monthly outreach, responses, and hires</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={outreachOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="outreach" stroke="#8884d8" name="Outreach" />
                        <Line type="monotone" dataKey="responses" stroke="#82ca9d" name="Responses" />
                        <Line type="monotone" dataKey="hires" stroke="#ffc658" name="Hires" />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Response Rate Trend</CardTitle>
                    <CardDescription>Monthly response rate percentage</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={[
                            { name: "Jan", value: 48 },
                            { name: "Feb", value: 52 },
                            { name: "Mar", value: 51 },
                            { name: "Apr", value: 56 },
                            { name: "May", value: 55 },
                            { name: "Jun", value: 62 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Response Rate %" />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Conversion Rate Trend</CardTitle>
                    <CardDescription>Monthly hire conversion percentage</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={[
                            { name: "Jan", value: 6.7 },
                            { name: "Feb", value: 7.8 },
                            { name: "Mar", value: 10.4 },
                            { name: "Apr", value: 9.8 },
                            { name: "May", value: 6.9 },
                            { name: "Jun", value: 10.8 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Conversion Rate %" />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>
                </div>

                <Card>
                <CardHeader>
                    <CardTitle>Outreach Method Effectiveness Over Time</CardTitle>
                    <CardDescription>Email vs LinkedIn response rates by month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                        data={[
                            { name: "Jan", email: 45, linkedin: 52 },
                            { name: "Feb", email: 48, linkedin: 55 },
                            { name: "Mar", email: 52, linkedin: 51 },
                            { name: "Apr", email: 55, linkedin: 58 },
                            { name: "May", email: 58, linkedin: 53 },
                            { name: "Jun", email: 62, linkedin: 60 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="email" stroke="#8884d8" name="Email Response Rate %" />
                        <Line type="monotone" dataKey="linkedin" stroke="#82ca9d" name="LinkedIn Response Rate %" />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
        </div>
        </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "outreach sent":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Outreach Sent
        </Badge>
      )
    case "responded":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Responded
        </Badge>
      )
    case "interviewed":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Interviewed
        </Badge>
      )
    case "offered":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Offered
        </Badge>
      )
    case "hired":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Hired
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          {status}
        </Badge>
      )
  }
}

function ArrowRight() {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="h-0.5 w-full bg-gray-200"></div>
        <ArrowDown className="h-4 w-4 text-gray-400 mx-1" />
        <div className="h-0.5 w-full bg-gray-200"></div>
      </div>
    )
  }