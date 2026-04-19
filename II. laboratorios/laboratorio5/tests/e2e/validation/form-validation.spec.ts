import { expect, test } from "@playwright/test";

test.describe("Validaciones de formularios", () => {
  test("@validation @student rechaza código con longitud inválida", async ({ page }) => {
    await page.goto("/student");

    await page.getByTestId("join-poll-code").fill("ABC12");
    await page.getByTestId("join-poll-voter-name").fill("Estudiante Demo");
    await page.getByRole("button", { name: "Unirme" }).click();

    await expect(page.getByText("El código debe tener 6 caracteres.")).toBeVisible();
    await expect(page.getByText("Ingresa el código para ver la encuesta disponible y comenzar a votar.")).toBeVisible();
  });

  test("@validation @professor requiere título y dos opciones válidas", async ({ page }) => {
    await page.goto("/professor");

    await page.getByTestId("poll-option-input-1").fill("React");
    await page.getByTestId("poll-option-input-2").fill("Vue");
    await page.getByRole("button", { name: "Crear encuesta" }).click();

    await expect(page.getByText("Escribe un título para la encuesta.")).toBeVisible();

    await page.locator("#poll-title").fill("Encuesta sin opciones");
    await page.getByTestId("poll-option-input-1").fill("React");
    await page.getByTestId("poll-option-input-2").fill("");
    await page.getByRole("button", { name: "Crear encuesta" }).click();

    await expect(page.getByText("Agrega al menos dos opciones válidas.")).toBeVisible();
  });
});
