import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return Response.json({ message: "No key provided" }, { status: 400 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })

    const response = await s3Client.send(command)
    const buffer: any = await response.Body?.transformToByteArray()

    return new Response(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`,
      },
    })
  } catch (error) {
    console.error("S3 Download Error:", error)
    return Response.json({ message: "Download failed" }, { status: 500 })
  }
}
