import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "selo-tria";

export async function uploadToS3(
  file: File | Buffer,
  key: string
): Promise<string> {
  try {
    let body: Buffer;

    if (file instanceof File) {
      body = Buffer.from(await file.arrayBuffer());
    } else {
      body = file;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType:
        file instanceof File ? file.type : "application/octet-stream",
    });

    await s3Client.send(command);

    // Return public URL or signed URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Erro ao fazer upload para S3");
  }
}

export async function getSignedS3Url(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return url;
  } catch (error) {
    console.error("S3 signed URL error:", error);
    throw new Error("Erro ao gerar URL assinada do S3");
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Erro ao deletar arquivo de S3");
  }
}
