import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

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

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })

    await s3Client.send(command)

    return Response.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("S3 Delete Error:", error)
    return Response.json({ message: "Delete failed" }, { status: 500 })
  }
}
