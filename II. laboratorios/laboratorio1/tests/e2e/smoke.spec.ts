import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

type PollOption = {
  text: string;
  votes: number;
};

type PollVote = {
  voterName: string;
  optionIndex: number;
  createdAt: string;
};

type MockPoll = {
  _id: string;
  title: string;
  status: "active" | "closed";
  code: string;
  createdAt: string;
  closedAt: string | null;
  options: PollOption[];
  votes: PollVote[];
};

const ARTIFACTS_ROOT = path.resolve(process.cwd(), "tests", "artifacts");
const SCREENSHOTS_DIR = path.join(ARTIFACTS_ROOT, "capturas");
const VIDEOS_DIR = path.join(ARTIFACTS_ROOT, "videos");
const GITHUB_REPOSITORY_URL = "https://github.com/Chrisvlj/2026-241-valdespino-christian";

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureArtifactDirectories() {
  await Promise.all([
    mkdir(SCREENSHOTS_DIR, { recursive: true }),
    mkdir(VIDEOS_DIR, { recursive: true }),
  ]);
}

function createMockPoll(title: string, code: string): MockPoll {
  return {
    _id: `${slugify(title)}-${uniqueSuffix()}`,
    title,
    status: "active",
    code,
    createdAt: new Date().toISOString(),
    closedAt: null,
    options: [
      { text: "React", votes: 0 },
      { text: "Vue", votes: 0 },
    ],
    votes: [],
  };
}

function toPollListItem(poll: MockPoll) {
  return {
    _id: poll._id,
    title: poll.title,
    options: poll.options,
    status: poll.status,
    code: poll.code,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt,
    totalVotes: poll.votes.length,
  };
}

function toPollResults(poll: MockPoll) {
  return {
    _id: poll._id,
    title: poll.title,
    status: poll.status,
    code: poll.code,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt,
    totalVotes: poll.votes.length,
    options: poll.options.map((option, index) => ({
      index,
      text: option.text,
      votes: option.votes,
    })),
    votes: [...poll.votes],
  };
}

test.beforeAll(async () => {
  await ensureArtifactDirectories();
});

test.afterEach(async ({ page }, testInfo) => {
  await ensureArtifactDirectories();

  const artifactName = `${slugify(testInfo.title)}-${testInfo.project.name}`;
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${artifactName}.png`);
  const videoPath = path.join(VIDEOS_DIR, `${artifactName}.webm`);

  if (!page.isClosed()) {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach("captura-final", { path: screenshotPath, contentType: "image/png" });
  }

  const video = page.video();
  if (!video) {
    return;
  }

  if (!page.isClosed()) {
    await page.close();
  }

  const sourceVideoPath = await video.path();
  await copyFile(sourceVideoPath, videoPath);
  await testInfo.attach("video-flujo", { path: videoPath, contentType: "video/webm" });
});

test("@smoke @routes landing renders and shows key actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Votaciones en clase/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Soy Profesor" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Soy Estudiante" })).toBeVisible();

  const repositoryLink = page.getByRole("link", { name: /Ver repositorio en GitHub/i });
  await expect(repositoryLink).toBeVisible();
  await expect(repositoryLink).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
  await expect(repositoryLink).toHaveAttribute("target", "_blank");
  await expect(repositoryLink).toHaveAttribute("rel", /noopener/);
  await expect(repositoryLink).toHaveAttribute("rel", /noreferrer/);
});

test("@smoke @professor professor creates a poll and opens results", async ({ page }) => {
  const title = `Encuesta UI ${uniqueSuffix()}`;
  const pollCode = "PRF001";
  let createdPoll: MockPoll | null = null;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api/polls" && request.method() === "GET") {
      const list = createdPoll ? [toPollListItem(createdPoll)] : [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(list) });
      return;
    }

    if (pathname === "/api/polls" && request.method() === "POST") {
      const body = request.postDataJSON() as { title: string };
      createdPoll = createMockPoll(body.title, pollCode);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(toPollListItem(createdPoll)) });
      return;
    }

    if (pathname.endsWith("/results") && request.method() === "GET" && createdPoll) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollResults(createdPoll)) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Ruta mock no encontrada" }) });
  });

  await page.goto("/professor");
  await expect(page.getByRole("heading", { name: /Vista del profesor/i })).toBeVisible();

  await page.locator("#poll-title").fill(title);
  await page.locator('input[placeholder="Opción 1"]').fill("React");
  await page.locator('input[placeholder="Opción 2"]').fill("Vue");
  await page.getByRole("button", { name: "Crear encuesta" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const firstResultsLink = page.getByRole("link", { name: "Ver resultados" }).first();
  await firstResultsLink.click();

  await expect(page).toHaveURL(/\/professor\/poll\/.+/);
  await expect(page.getByRole("heading", { name: /Resultados del profesor/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("button", { name: /Copiar codigo|Copiar código/i })).toBeVisible();
});

test("@smoke @student student joins by code and votes once", async ({ page }) => {
  const poll = createMockPoll(`Encuesta voto ${uniqueSuffix()}`, "STU001");
  const studentName = `Estudiante ${uniqueSuffix()}`;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === `/api/polls/code/${poll.code}` && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollResults(poll)) });
      return;
    }

    if (pathname === `/api/polls/${poll._id}/results` && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollResults(poll)) });
      return;
    }

    if (pathname === `/api/polls/${poll._id}/vote` && request.method() === "POST") {
      const body = request.postDataJSON() as { optionIndex: number; voterName: string };
      const normalizedIncoming = body.voterName.trim().replace(/\s+/g, " ").toLowerCase();
      const duplicateVote = poll.votes.some((vote) => vote.voterName.trim().replace(/\s+/g, " ").toLowerCase() === normalizedIncoming);

      if (duplicateVote) {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "Ya votaste" }) });
        return;
      }

      poll.votes.unshift({
        voterName: body.voterName,
        optionIndex: body.optionIndex,
        createdAt: new Date().toISOString(),
      });
      poll.options[body.optionIndex].votes += 1;

      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(toPollResults(poll)) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Ruta mock no encontrada" }) });
  });

  await page.goto("/student");
  await expect(page.getByRole("heading", { name: /Vista del estudiante/i })).toBeVisible();

  await page.locator("#poll-code").fill(poll.code);
  await page.locator("#voter-name").fill(studentName);
  await page.getByRole("button", { name: "Unirme" }).click();

  await expect(page.getByText(poll.title)).toBeVisible();
  await page.getByRole("button", { name: /Opción 1/i }).click();
  await page.getByRole("button", { name: "Votar ahora" }).click();

  await expect(page.getByText(studentName)).toBeVisible();
  await expect(page.getByText(/1 votos registrados/i)).toBeVisible();

  await page.getByRole("button", { name: "Reiniciar" }).click();
  await page.locator("#poll-code").fill(poll.code);
  await page.locator("#voter-name").fill(studentName);
  await page.getByRole("button", { name: "Unirme" }).click();

  await expect(page.getByText("Ya votaste")).toBeVisible();
});

test("@smoke @student closed poll blocks new student votes", async ({ page }) => {
  const poll = createMockPoll(`Encuesta cierre ${uniqueSuffix()}`, "CLS001");

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === `/api/polls/${poll._id}/results` && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollResults(poll)) });
      return;
    }

    if (pathname === `/api/polls/${poll._id}/close` && request.method() === "PATCH") {
      poll.status = "closed";
      poll.closedAt = new Date().toISOString();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollListItem(poll)) });
      return;
    }

    if (pathname === `/api/polls/code/${poll.code}` && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toPollResults(poll)) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Ruta mock no encontrada" }) });
  });

  await page.goto(`/professor/poll/${poll._id}`);
  await expect(page.getByRole("heading", { name: poll.title })).toBeVisible();

  await page.getByRole("button", { name: "Cerrar encuesta" }).click();
  await expect(page.getByRole("button", { name: "Encuesta cerrada" })).toBeVisible();

  await page.goto("/student");
  await page.locator("#poll-code").fill(poll.code);
  await page.locator("#voter-name").fill(`Nuevo ${uniqueSuffix()}`);
  await page.getByRole("button", { name: "Unirme" }).click();

  await expect(page.getByRole("heading", { name: poll.title })).toBeVisible();
  await expect(page.getByText("0 votos registrados")).toBeVisible();
  await expect(page.getByRole("button", { name: "Votar ahora" })).toHaveCount(0);
});
