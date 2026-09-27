import { saveSchema, MAX_FILE_BYTES } from "./rules";
import type { Game } from "@/types/game";

// Keep the original database name, version and stores: existing games stay intact.
let connection: Promise<IDBDatabase> | undefined;
const urls = new Map<string, string>();
function database() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("khung-anh-bi-mat", 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("games"))
        d.createObjectStore("games", { keyPath: "id" });
      if (!d.objectStoreNames.contains("assets"))
        d.createObjectStore("assets", { keyPath: "path" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      connection = undefined;
      reject(r.error);
    };
  }));
}
async function read<T>(store: string, key?: IDBValidKey): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store);
    const request =
      key === undefined
        ? tx.objectStore(store).getAll()
        : tx.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function put(store: string, value: unknown) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || Error("Không đủ dung lượng để lưu."));
    tx.onerror = () => reject(tx.error);
  });
}
async function assetUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (urls.has(path)) return urls.get(path)!;
  const entry = await read<{ blob: Blob } | undefined>("assets", path);
  if (!entry) return null;
  const url = URL.createObjectURL(entry.blob);
  urls.set(path, url);
  return url;
}
export async function hydrate(game: Game): Promise<Game> {
  return {
    ...game,
    musicName: game.musicName || "Nhạc nền.mp3",
    musicUrl: await assetUrl(game.musicPath),
    rounds: await Promise.all(
      game.rounds.map(async (r) => ({
        ...r,
        rewardStickerEnabled: r.rewardStickerEnabled ?? false,
        rewardStickerMode: r.rewardStickerMode ?? "random",
        completionText: r.completionText ?? r.completionMessage ?? "",
        completionImagePath: r.completionImagePath ?? null,
        imageUrl: (await assetUrl(r.imagePath)) || undefined,
        completionImageUrl: await assetUrl(r.completionImagePath),
      })),
    ),
  };
}
function fresh(): Game {
  return {
    id: crypto.randomUUID(),
    code: "",
    status: "draft",
    version: 0,
    updatedAt: new Date().toISOString(),
    title: "Trò chơi mới",
    description: "",
    subject: "",
    grade: "",
    musicPath: null,
    musicName: "",
    musicEnabled: true,
    musicVolume: 0.35,
    timerMode: "none",
    timeLimit: 300,
    scoreEnabled: false,
    sfxEnabled: true,
    rounds: [],
  };
}
async function upload(id: string, form: FormData) {
  const file = form.get("file"),
    kind = form.get("kind");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES)
    throw Error("Mỗi tệp cần nhỏ hơn 4 MB.");
  let blob: Blob = file,
    width = 0,
    height = 0,
    ext = "mp3";
  if (kind === "image") {
    if (!file.type.startsWith("image/")) throw Error("Hãy chọn một tệp ảnh.");
    let image: ImageBitmap;
    try {
      image = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      throw Error("Ảnh này chưa đọc được. Hãy thử ảnh JPG, PNG hoặc WebP.");
    }
    try {
      if (image.width * image.height > 40_000_000)
        throw Error("Ảnh quá lớn. Hãy chọn bản ảnh nhỏ hơn.");
      const scale = Math.min(1, 2560 / image.width, 2560 / image.height);
      width = Math.max(1, Math.round(image.width * scale));
      height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Không thể xử lý ảnh.");
      ctx.drawImage(image, 0, 0, width, height);
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(Error("Không thể lưu ảnh."))),
          "image/webp",
          0.88,
        ),
      );
      ext = "webp";
    } finally {
      image.close();
    }
  } else if (
    kind !== "audio" ||
    !(
      /\.mp3$/i.test(file.name) &&
      ["audio/mpeg", "audio/mp3", ""].includes(file.type)
    )
  )
    throw Error("Hãy chọn tệp nhạc MP3.");
  if (blob.size > MAX_FILE_BYTES)
    throw Error("Tệp sau khi xử lý vượt quá 4 MB.");
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  await put("assets", { path, blob });
  const url = URL.createObjectURL(blob);
  urls.set(path, url);
  return { path, url, width, height };
}
async function save(id: string, body: string) {
  const parsed = saveSchema.safeParse(JSON.parse(body));
  if (!parsed.success)
    throw Error("Hãy kiểm tra tên trò chơi và số hàng, số cột trước khi lưu.");
  const input = parsed.data;
  const db = await database();
  return new Promise<{ version: number; updatedAt: string }>(
    (resolve, reject) => {
      const tx = db.transaction("games", "readwrite"),
        store = tx.objectStore("games"),
        request = store.get(id);
      let result: { version: number; updatedAt: string };
      let failure: Error | undefined;
      request.onsuccess = () => {
        const game = request.result as Game | undefined;
        if (!game) {
          failure = Error("Không tìm thấy trò chơi.");
          tx.abort();
          return;
        }
        if (game.version !== input.version) {
          failure = Error(
            "Trò chơi đã được sửa ở cửa sổ khác. Hãy tải lại trang.",
          );
          tx.abort();
          return;
        }
        result = {
          version: game.version + 1,
          updatedAt: new Date().toISOString(),
        };
        store.put({ ...game, ...input, ...result });
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () =>
        reject(failure || tx.error || Error("Chưa lưu được trò chơi."));
      tx.onerror = () => reject(tx.error);
    },
  );
}
async function deleteGame(id: string) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["games", "assets"], "readwrite");
    tx.objectStore("games").delete(id);
    const cursor = tx.objectStore("assets").openCursor();
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        if (String(c.key).startsWith(id + "/")) {
          c.delete();
          const url = urls.get(String(c.key));
          if (url) URL.revokeObjectURL(url);
          urls.delete(String(c.key));
        }
        c.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method || "GET";
  let match = path.match(/^\/api\/games\/([0-9a-f-]+)\/upload$/i);
  if (match && method === "POST")
    return (await upload(
      match[1],
      await new Response(init.body).formData(),
    )) as T;
  match = path.match(/^\/api\/games\/([0-9a-f-]+)$/i);
  if (match) {
    if (method === "GET") {
      const game = await read<Game | undefined>("games", match[1]);
      if (!game) throw Error("Không tìm thấy trò chơi.");
      return (await hydrate(game)) as T;
    }
    if (method === "PUT") return (await save(match[1], String(init.body))) as T;
    if (method === "DELETE") {
      await deleteGame(match[1]);
      return { ok: true } as T;
    }
  }
  if (path === "/api/games") {
    if (method === "POST") {
      const game = fresh();
      await put("games", game);
      return game as T;
    }
    if (method === "GET") {
      const games = await read<Game[]>("games");
      games.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return (await Promise.all(games.map(hydrate))) as T;
    }
  }
  throw Error("Thao tác chưa được hỗ trợ.");
}
