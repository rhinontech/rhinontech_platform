import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ message: "No file provided" }, { status: 400 })
    }

    const folderPrefix = process.env.AWS_S3_FOLDER_NAME ? `${process.env.AWS_S3_FOLDER_NAME}/` : ""
    const fileKey = `${folderPrefix}${file.name}`

    const buffer = await file.arrayBuffer()
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    })

    await s3Client.send(command)

    return Response.json({
      message: "File uploaded successfully",
      fileName: file.name,
    })
  } catch (error) {
    console.error("S3 Upload Error:", error)
    return Response.json({ message: "Upload failed" }, { status: 500 })
  }
}
