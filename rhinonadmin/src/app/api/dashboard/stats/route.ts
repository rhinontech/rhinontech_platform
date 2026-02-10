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
            const res = await client.query('SELECT COUNT(*) FROM "users"');
            const totalUsers = parseInt(res.rows[0].count, 10);
            return NextResponse.json({ totalUsers });
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
