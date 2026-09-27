import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import {
  db,
  userId,
  json,
  route,
  owned,
  BUCKET,
  HttpError,
} from "@/lib/server";
import { MAX_FILE_BYTES } from "@/lib/rules";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const owner = await userId(req),
      { id } = await ctx.params;
    await owned(id, owner);
    // Limit the streamed body before parsing multipart, including chunked requests.
    const reader = req.body?.getReader();
    if (!reader) throw new HttpError(400, "Chưa có tệp.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_BYTES + 128000) {
        await reader.cancel();
        throw new HttpError(413, "Mỗi tệp tối đa 4 MB.");
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file"),
      kind = form.get("kind");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > MAX_FILE_BYTES
    )
      throw new HttpError(400, "Hãy chọn tệp từ 1 byte đến 4 MB.");
    if (kind !== "image" && kind !== "audio")
      throw new HttpError(400, "Loại tệp không hợp lệ.");
    const buffer = Buffer.from(await file.arrayBuffer()),
      detected = await fileTypeFromBuffer(buffer);
    let output: Buffer = buffer,
      mime = "audio/mpeg",
      ext = "mp3",
      width = 0,
      height = 0;
    if (kind === "image") {
      if (
        !/\.(jpe?g|png|webp)$/i.test(file.name) ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !detected ||
        !["image/jpeg", "image/png", "image/webp"].includes(detected.mime)
      )
        throw new HttpError(400, "Chỉ nhận ảnh JPG, PNG hoặc WEBP hợp lệ.");
      try {
        const result = await sharp(buffer, { limitInputPixels: 40000000 })
          .rotate()
          .resize({
            width: 2560,
            height: 2560,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 90 })
          .toBuffer({ resolveWithObject: true });
        output = result.data;
        width = result.info.width;
        height = result.info.height;
      } catch {
        throw new HttpError(
          400,
          "Không đọc được ảnh hoặc ảnh vượt quá 40 triệu điểm ảnh.",
        );
      }
      mime = "image/webp";
      ext = "webp";
    } else if (
      !/\.mp3$/i.test(file.name) ||
      !["audio/mpeg", "audio/mp3"].includes(file.type) ||
      detected?.mime !== "audio/mpeg"
    )
      throw new HttpError(400, "Hãy chọn tệp nhạc MP3 hợp lệ.");
    const path = `${owner}/${id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db()
      .storage.from(BUCKET)
      .upload(path, output, { contentType: mime, upsert: false });
    if (error) throw error;
    const { data: signed, error: signError } = await db()
      .storage.from(BUCKET)
      .createSignedUrl(path, 3600);
    if (signError) throw signError;
    return json({ path, url: signed!.signedUrl, width, height }, 201);
  });
}
