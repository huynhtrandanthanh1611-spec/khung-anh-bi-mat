import { saveSchema, MAX_FILE_BYTES } from "./rules";
import type { Game, PlayGame, Round } from "@/types/game";

type StoredGame = Omit<Game, "rounds" | "musicUrl"> & { rounds: Round[] };
const DB = "khung-anh-bi-mat",
  VERSION = 1;
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, VERSION);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("games"))
        d.createObjectStore("games", { keyPath: "id" });
      if (!d.objectStoreNames.contains("assets"))
        d.createObjectStore("assets", { keyPath: "path" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const d = await database();
  return new Promise((resolve, reject) => {
    const r = d.transaction(store).objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function all<T>(store: string): Promise<T[]> {
  const d = await database();
  return new Promise((resolve, reject) => {
    const r = d.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function put(store: string, value: unknown): Promise<void> {
  const d = await database();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function remove(store: string, key: IDBValidKey): Promise<void> {
  const d = await database();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function asset(path: string): Promise<Blob> {
  const row = await get<{ path: string; blob: Blob }>("assets", path);
  if (!row) throw Error("Không tìm thấy tệp ảnh/nhạc.");
  return row.blob;
}
async function assetUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  return URL.createObjectURL(await asset(path));
}
async function hydrate(g: StoredGame): Promise<Game> {
  return {
    ...g,
    musicUrl: await assetUrl(g.musicPath),
    rounds: await Promise.all(
      g.rounds.map(async (r) => ({
        ...r,
        imageUrl: (await assetUrl(r.imagePath)) || undefined,
      })),
    ),
  };
}
function fresh(): Game {
  return {
    id: crypto.randomUUID(),
    code: Math.random().toString(36).slice(2, 10).toUpperCase(),
    status: "draft",
    version: 0,
    updatedAt: new Date().toISOString(),
    title: "Trò chơi mới",
    description: "",
    subject: "",
    grade: "",
    musicPath: null,
    musicEnabled: true,
    musicVolume: 0.35,
    timerMode: "none",
    timeLimit: 300,
    scoreEnabled: false,
    sfxEnabled: false,
    rounds: [],
  };
}
async function upload(id: string, form: FormData) {
  const file = form.get("file"),
    kind = form.get("kind");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES)
    throw Error("Tệp phải nhỏ hơn 4 MB.");
  let blob: Blob = file,
    ext = "mp3",
    width = 0,
    height = 0;
  if (kind === "image") {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw Error("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
    const image = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    try {
      if (image.width * image.height > 40_000_000)
        throw Error("Ảnh vượt quá 40 triệu điểm ảnh.");
      const scale = Math.min(1, 2560 / image.width, 2560 / image.height);
      width = Math.round(image.width * scale);
      height = Math.round(image.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Không thể xử lý ảnh.");
      ctx.drawImage(image, 0, 0, width, height);
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(Error("Không thể chuyển ảnh."))),
          "image/webp",
          0.86,
        ),
      );
    } finally {
      image.close();
    }
    ext = "webp";
  } else if (
    kind !== "audio" ||
    !(
      /\.mp3$/i.test(file.name) &&
      ["audio/mpeg", "audio/mp3"].includes(file.type)
    )
  )
    throw Error("Chỉ nhận nhạc MP3.");
  if (blob.size > MAX_FILE_BYTES) throw Error("Tệp sau khi xử lý vượt quá 4 MB.");
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  await put("assets", { path, blob });
  return { path, url: URL.createObjectURL(blob), width, height };
}
export async function loadPublished(code: string): Promise<PlayGame> {
  const games = await all<StoredGame>("games"),
    g = games.find(
      (x) => x.code === code.trim().toUpperCase() && x.status === "published",
    );
  if (!g)
    throw Error(
      "Không tìm thấy trò chơi trên thiết bị này. Trò chơi cục bộ không được đồng bộ qua link.",
    );
  return {
    title: g.title,
    description: g.description,
    musicEnabled: g.musicEnabled,
    musicVolume: g.musicVolume,
    timerMode: g.timerMode,
    timeLimit: g.timeLimit,
    scoreEnabled: g.scoreEnabled,
    sfxEnabled: g.sfxEnabled,
    musicUrl: g.musicEnabled ? await assetUrl(g.musicPath) : null,
    rounds: await Promise.all(
      g.rounds
        .filter((r) => r.enabled)
        .map(async (r) => ({
          ...r,
          imageUrl: (await assetUrl(r.imagePath)) || "",
        })),
    ),
  };
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method || "GET";
  let m = path.match(/^\/api\/games\/([0-9a-f-]+)\/upload$/i);
  if (m && method === "POST")
    return (await upload(m[1], await new Response(init.body).formData())) as T;
  m = path.match(/^\/api\/games\/([0-9a-f-]+)\/publish$/i);
  if (m && method === "POST") {
    const g = await get<StoredGame>("games", m[1]);
    if (!g) throw Error("Không tìm thấy trò chơi.");
    const { version, publish } = JSON.parse(String(init.body));
    if (g.version !== version)
      throw Error("Trò chơi đã được sửa ở cửa sổ khác. Hãy tải lại trang.");
    if (publish && !g.rounds.some((r) => r.enabled))
      throw Error("Hãy thêm ít nhất một vòng chơi trước khi chia sẻ.");
    g.status = publish ? "published" : "draft";
    g.version++;
    g.updatedAt = new Date().toISOString();
    await put("games", g);
    return { version: g.version, status: g.status, code: g.code } as T;
  }
  m = path.match(/^\/api\/games\/([0-9a-f-]+)\/clone$/i);
  if (m && method === "POST") {
    const source = await get<StoredGame>("games", m[1]);
    if (!source) throw Error("Không tìm thấy trò chơi.");
    const copy = fresh();
    copy.title = `${source.title.slice(0, 135)} (bản sao)`;
    copy.description = source.description;
    copy.subject = source.subject;
    copy.grade = source.grade;
    copy.musicEnabled = source.musicEnabled;
    copy.musicVolume = source.musicVolume;
    copy.timerMode = source.timerMode;
    copy.timeLimit = source.timeLimit;
    copy.scoreEnabled = source.scoreEnabled;
    copy.sfxEnabled = source.sfxEnabled;
    for (const r of source.rounds) {
      const path = `${copy.id}/${crypto.randomUUID()}.${r.imagePath.split(".").pop()}`;
      await put("assets", { path, blob: await asset(r.imagePath) });
      copy.rounds.push({
        ...r,
        id: crypto.randomUUID(),
        imagePath: path,
        imageUrl: undefined,
      });
    }
    if (source.musicPath) {
      copy.musicPath = `${copy.id}/${crypto.randomUUID()}.mp3`;
      await put("assets", {
        path: copy.musicPath,
        blob: await asset(source.musicPath),
      });
    }
    await put("games", copy);
    return { id: copy.id } as T;
  }
  m = path.match(/^\/api\/games\/([0-9a-f-]+)$/i);
  if (m && method === "GET") {
    const g = await get<StoredGame>("games", m[1]);
    if (!g) throw Error("Không tìm thấy trò chơi.");
    return (await hydrate(g)) as T;
  }
  if (m && method === "PUT") {
    const input = saveSchema.parse(JSON.parse(String(init.body))),
      g = await get<StoredGame>("games", m[1]);
    if (!g) throw Error("Không tìm thấy trò chơi.");
    if (input.version !== g.version)
      throw Error("Trò chơi đã được sửa ở cửa sổ khác. Hãy tải lại trang.");
    const { version, rounds, ...settings } = input;
    Object.assign(g, settings, {
      rounds,
      version: g.version + 1,
      updatedAt: new Date().toISOString(),
    });
    await put("games", g);
    return { version: g.version, updatedAt: g.updatedAt } as T;
  }
  if (m && method === "DELETE") {
    const g = await get<StoredGame>("games", m[1]);
    if (g) {
      for (const r of g.rounds) await remove("assets", r.imagePath);
      if (g.musicPath) await remove("assets", g.musicPath);
      await remove("games", g.id);
    }
    return { ok: true } as T;
  }
  if (path === "/api/games" && method === "POST") {
    const g = fresh();
    await put("games", g);
    return (await hydrate(g)) as T;
  }
  if (path === "/api/games" && method === "GET") {
    const games = (await all<StoredGame>("games")).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    return (await Promise.all(games.map(hydrate))) as T;
  }
  throw Error("Thao tác này không được hỗ trợ.");
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function exportGame(id: string): Promise<Blob> {
  const game = await get<StoredGame>("games", id);
  if (!game) throw Error("Không tìm thấy trò chơi.");
  game.rounds = game.rounds.filter((r) => r.enabled);
  const paths = [
      ...game.rounds.map((r) => r.imagePath),
      ...(game.musicPath ? [game.musicPath] : []),
    ],
    assets: Record<string, string> = {};
  for (const path of paths) assets[path] = await dataUrl(await asset(path));
  return new Blob(
    [JSON.stringify({ format: "khung-anh-bi-mat", version: 1, game, assets })],
    { type: "application/json" },
  );
}
export async function importGame(file: File): Promise<string> {
  if (file.size > 300 * 1024 * 1024)
    throw Error("Tệp trò chơi lớn hơn 300 MB.");
  const pack = JSON.parse(await file.text());
  if (
    pack.format !== "khung-anh-bi-mat" ||
    pack.version !== 1 ||
    !pack.assets ||
    typeof pack.assets !== "object"
  )
    throw Error("Tệp trò chơi không hợp lệ.");
  const input = saveSchema.parse(pack.game);
  if (!input.rounds.some((r) => r.enabled))
    throw Error("Tệp chưa có vòng chơi đang bật.");
  const game: StoredGame = {
    ...fresh(),
    ...input,
    status: "published",
    version: 0,
  };
  const items: { path: string; blob: Blob }[] = [];
  const copyAsset = async (oldPath: string, kind: "image" | "audio") => {
    const url = pack.assets[oldPath];
    const prefix =
      kind === "image"
        ? /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/
        : /^data:audio\/(mpeg|mp3);base64,[A-Za-z0-9+/=]+$/;
    if (typeof url !== "string" || !prefix.test(url))
      throw Error("Ảnh hoặc nhạc trong tệp không hợp lệ.");
    const blob = await (await fetch(url)).blob();
    if (blob.size > MAX_FILE_BYTES) throw Error("Ảnh hoặc nhạc vượt quá 4 MB.");
    const path = `${game.id}/${crypto.randomUUID()}.${kind === "image" ? "webp" : "mp3"}`;
    items.push({ path, blob });
    return path;
  };
  game.rounds = await Promise.all(
    input.rounds.map(async (r) => ({
      ...r,
      id: crypto.randomUUID(),
      imagePath: await copyAsset(r.imagePath, "image"),
    })),
  );
  game.musicPath = input.musicPath
    ? await copyAsset(input.musicPath, "audio")
    : null;
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["games", "assets"], "readwrite");
    for (const item of items) tx.objectStore("assets").put(item);
    tx.objectStore("games").put(game);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
  return game.code;
}
