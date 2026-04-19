import { NextResponse } from "next/server";

export const revalidate = 30;

type Bucket = "side" | "todo" | "urgent" | "progress" | "complete";

type Task = {
  id: string;
  t: string;
  bucket: Bucket;
  whoName: string;
  whoInitials: string;
  age: string;
  lastEdited: string;
  createdAt: string;
};

type NotionPerson = { name?: string };
type NotionTitlePart = { plain_text?: string };
type NotionSelect = { name?: string };

type NotionProperty = {
  title?: NotionTitlePart[];
  rich_text?: NotionTitlePart[];
  select?: NotionSelect;
  status?: NotionSelect;
  people?: NotionPerson[];
  date?: { start?: string };
};

type NotionPage = {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, NotionProperty>;
};

type NotionQueryResponse = {
  results: NotionPage[];
};

function mapStatusToBucket(raw: string): Bucket | null {
  const s = raw.toLowerCase().trim();
  if (!s) return null;
  if (s.includes("complete") || s === "done" || s.includes("shipped")) return "complete";
  if (s.includes("progress") || s.includes("doing") || s.includes("cook")) return "progress";
  if (s.includes("urgent") || s.includes("fire") || s.includes("blocked")) return "urgent";
  if (s.includes("side") || s.includes("daydream") || s.includes("parking") || s.includes("backlog"))
    return "side";
  if (s.includes("todo") || s === "to do" || s.includes("deck") || s.includes("queue")) return "todo";
  return null;
}

function humanAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function initials(name: string): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function readTitle(prop?: NotionProperty): string {
  if (!prop) return "";
  const parts = prop.title ?? prop.rich_text ?? [];
  return parts.map((p) => p.plain_text ?? "").join("").trim();
}

function readSelect(prop?: NotionProperty): string {
  if (!prop) return "";
  return (prop.select?.name ?? prop.status?.name ?? "").trim();
}

function readPerson(prop?: NotionProperty): string {
  if (!prop) return "";
  return (prop.people?.[0]?.name ?? "").trim();
}

function pickProperty(
  props: Record<string, NotionProperty>,
  candidates: string[],
): NotionProperty | undefined {
  const lower = Object.fromEntries(
    Object.entries(props).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const c of candidates) {
    const hit = lower[c.toLowerCase()];
    if (hit) return hit;
  }
  return undefined;
}

export async function GET() {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    return NextResponse.json({
      tasks: [],
      configured: false,
      error: "Set NOTION_TOKEN and NOTION_DATABASE_ID in .env.local",
    });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100 }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({
        tasks: [],
        configured: true,
        error: `Notion API ${res.status}: ${body.slice(0, 300)}`,
      });
    }

    const data = (await res.json()) as NotionQueryResponse;
    const tasks: Task[] = [];

    for (const page of data.results ?? []) {
      const props = page.properties ?? {};
      const title = readTitle(pickProperty(props, ["Name", "Title", "Task", "Task (public)"]));
      if (!title) continue;

      const statusRaw = readSelect(pickProperty(props, ["Status", "Bucket", "State", "Stage"]));
      const bucket = mapStatusToBucket(statusRaw);
      if (!bucket) continue;

      const ownerName =
        readPerson(pickProperty(props, ["Owner", "Assignee", "Person", "Who"])) || "";

      tasks.push({
        id: page.id,
        t: title,
        bucket,
        whoName: ownerName ? ownerName.split(/\s+/)[0].toLowerCase() : "—",
        whoInitials: initials(ownerName),
        age: humanAge(page.last_edited_time),
        lastEdited: page.last_edited_time,
        createdAt: page.created_time,
      });
    }

    return NextResponse.json({ tasks, configured: true });
  } catch (e) {
    return NextResponse.json({
      tasks: [],
      configured: true,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
