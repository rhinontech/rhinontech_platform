import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET() {
  try {
    const folderPrefix = process.env.AWS_S3_FOLDER_NAME ? `${process.env.AWS_S3_FOLDER_NAME}/` : ""

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Prefix: folderPrefix,
    })

    const response = await s3Client.send(command)
    const files = response.Contents || []

    return Response.json({ files })
  } catch (error) {
    console.error("S3 List Error:", error)
    return Response.json({ error: "Failed to list files" }, { status: 500 })
  }
}
