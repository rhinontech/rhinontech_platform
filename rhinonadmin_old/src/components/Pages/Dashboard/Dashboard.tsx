"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Shield,
} from "lucide-react";
import Loading from "@/app/loading";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: null,
    totalOrgs: null,
    activeSubs: null,
    monthlyRevenue: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalUsers: data.totalUsers,
          totalOrgs: data.totalOrgs,
          activeSubs: data.activeSubs,
          monthlyRevenue: data.monthlyRevenue,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUser = async () => {
    try {
      // Get role from cookies (set during login)
      const currentRole = Cookies.get("currentRole") || "admin";
      const authToken = Cookies.get("auth-token");

      // Check if user is logged in
      if (!authToken) {
        router.push("/login");
        return;
      }

      // Create dummy user based on role
      const dummyUser: User = {
        id: "1",
        name: "Admin User",
        email: "admin@rhinon.tech",
        role: currentRole as "admin" | "manager" | "user",
      };

      setUser(dummyUser);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading areaOnly={true} />
    );
  }

  if (!user) return null;


  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background dark:bg-background-dark">
      <div className="flex flex-1 flex-col w-full">
        <ScrollArea className="flex-1 h-0 p-4">
          <div className="max-w-7xl mx-auto py-10">
            <div className="mb-6">
              <h2 className="text-3xl font-bold]">
                Welcome back, {user.name}!
              </h2>
              <p className="text-gray-500 mt-1">
                Here's what's happening with your account today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalUsers !== null ? stats.totalUsers : "..."}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                  <Building2 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalOrgs !== null ? stats.totalOrgs : "..."}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total companies
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Subscriptions
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.activeSubs !== null ? stats.activeSubs : "..."}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current active plans</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    30-Day Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.monthlyRevenue !== null ? `$${stats.monthlyRevenue}` : "..."}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    From successful transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Role-Based Content */}
            {user.role === "admin" && (
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Controls</CardTitle>
                    <CardDescription>
                      Manage system settings and users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="mr-2 h-4 w-4" />
                      Security Logs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>
                      Monitor platform performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU Usage</span>
                          <span className="font-medium">45%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[45%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory</span>
                          <span className="font-medium">62%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[62%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage</span>
                          <span className="font-medium">78%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 w-[78%]"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {user.role === "manager" && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>
                    Oversee your team's activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      View Team Members
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Team Analytics
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Project Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      action: "Updated project settings",
                      time: "2 hours ago",
                    },
                    { action: "Created new document", time: "5 hours ago" },
                    { action: "Invited team member", time: "1 day ago" },
                    {
                      action: "Modified user permissions",
                      time: "2 days ago",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between pb-4 last:pb-0 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
