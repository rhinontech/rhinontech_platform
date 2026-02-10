import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const envCookie = cookieStore.get("NEXT_ADMIN_ENV");
        const envName = envCookie?.value || "Beta"; // Default to Beta if no cookie

        const pool = getDbConnection(envName);
        const client = await pool.connect();

        try {
            const [usersRes, orgsRes, subsRes, revenueRes] = await Promise.all([
                client.query('SELECT COUNT(*) FROM "users"'),
                client.query('SELECT COUNT(*) FROM "organizations"'),
                client.query('SELECT COUNT(*) FROM "subscriptions" WHERE "subscription_end_date" > NOW()'),
                // Summing successful payments from the last 30 days
                client.query(`
                    SELECT SUM(payment_amount) as total 
                    FROM "transactions" 
                    WHERE "payment_status" = 'success' 
                    AND "created_at" > NOW() - INTERVAL '30 days'
                `)
            ]);

            const totalUsers = parseInt(usersRes.rows[0].count, 10);
            const totalOrgs = parseInt(orgsRes.rows[0].count, 10);
            const activeSubs = parseInt(subsRes.rows[0].count, 10);
            const monthlyRevenue = parseInt(revenueRes.rows[0].total || "0", 10);

            return NextResponse.json({
                totalUsers,
                totalOrgs,
                activeSubs,
                monthlyRevenue
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats", details: error.message },
            { status: 500 }
        );
    }
}
