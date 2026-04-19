import { expect, test } from "@playwright/test";
import { buildStudentName, buildTestTitle, cleanupPolls, createPollViaApi } from "../support/api";

test.describe("Flujos críticos laboratorio 5", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupPolls(request);
  });

  test("@integration @professor profesor crea encuesta y abre resultados", async ({ page }) => {
    const pollTitle = buildTestTitle("Encuesta profesor");

    await page.goto("/professor");
    await expect(page.getByRole("heading", { name: "Vista del profesor" })).toBeVisible();

    await page.locator("#poll-title").fill(pollTitle);
    await page.getByTestId("poll-option-input-1").fill("React");
    await page.getByTestId("poll-option-input-2").fill("Vue");
    await page.getByRole("button", { name: "Crear encuesta" }).click();

    await expect(page.getByRole("heading", { name: pollTitle })).toBeVisible();
    await expect(page.getByText(/^Activa$/)).toBeVisible();

    await page.getByRole("link", { name: "Ver resultados" }).first().click();

    await expect(page).toHaveURL(/\/professor\/poll\/[a-f0-9]{24}/i);
    await expect(page.getByRole("heading", { name: "Resultados del profesor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: pollTitle })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar codigo|Copiar código/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar encuesta" })).toBeVisible();
  });

  test("@integration @student estudiante entra por código, vota una vez y ve resultados", async ({ page, request }) => {
    const poll = await createPollViaApi(request, {
      title: buildTestTitle("Encuesta voto real"),
      options: ["React", "Vue"],
    });
    const studentName = buildStudentName();

    await page.goto("/student");
    await expect(page.getByRole("heading", { name: "Vista del estudiante" })).toBeVisible();

    await page.getByTestId("join-poll-code").fill(poll.code);
    await page.getByTestId("join-poll-voter-name").fill(studentName);
    await page.getByRole("button", { name: "Unirme" }).click();

    await expect(page.getByRole("heading", { name: poll.title })).toBeVisible();
    await page.getByTestId("vote-option-0").click();
    await page.getByRole("button", { name: "Votar ahora" }).click();

    await expect(page.getByText(studentName)).toBeVisible();
    await expect(page.getByText(/1 votos registrados/i)).toBeVisible();

    await page.getByRole("button", { name: "Reiniciar" }).click();
    await page.getByTestId("join-poll-code").fill(poll.code);
    await page.getByTestId("join-poll-voter-name").fill(studentName);
    await page.getByRole("button", { name: "Unirme" }).click();

    await expect(page.getByText("Ya votaste")).toBeVisible();
  });

  test("@integration @professor @student profesor cierra encuesta y bloquea nuevos votos", async ({ page, request }) => {
    const poll = await createPollViaApi(request, {
      title: buildTestTitle("Encuesta cierre real"),
      options: ["React", "Vue"],
    });
    const newStudent = buildStudentName("Nuevo");

    await page.goto(`/professor/poll/${poll._id}`);
    await expect(page.getByRole("heading", { name: poll.title })).toBeVisible();

    await page.getByRole("button", { name: "Cerrar encuesta" }).click();
    await expect(page.getByRole("button", { name: "Encuesta cerrada" })).toBeVisible();

    await page.goto("/student");
    await page.getByTestId("join-poll-code").fill(poll.code);
    await page.getByTestId("join-poll-voter-name").fill(newStudent);
    await page.getByRole("button", { name: "Unirme" }).click();

    await expect(page.getByRole("heading", { name: poll.title })).toBeVisible();
    await expect(page.getByText("0 votos registrados")).toBeVisible();
    await expect(page.getByRole("button", { name: "Votar ahora" })).toHaveCount(0);
  });
});
