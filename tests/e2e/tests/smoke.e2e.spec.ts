import { test, expect, Page } from "@playwright/test";

const getImageJobIds = async (page: Page): Promise<string[]> => {
  const jobIds = await page.getByTitle("Generated Image").evaluateAll((els) => els.map((el) => el.getAttribute("data-jobid")))
  return jobIds.filter(jobId => jobId !== null)
}

test("Log in and Generate an Image", async ({ page }) => {

  await page.goto('/');
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.E2E_USER_EMAIL);
  await page.getByTestId('sid-form-initial-submit-button').click();
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.E2E_USER_PASSWORD);
  await page.getByTestId('sid-form-authenticating-submit-button').click();

  // wait for app log out button to be visible
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible({ timeout: 10_000 });

  const beforeIds = await getImageJobIds(page)

  await page.getByRole('combobox', { name: 'Animal' }).click();
  await page.getByLabel('Hedgehog').getByText('Hedgehog').click();
  await page.getByRole('slider', { name: 'Number of Images' }).fill('1');
  await page.getByRole('button', { name: /Generate \d+ images/i }).click();

  await expect.poll(async () => {
    const currentIds = await getImageJobIds(page)
    const newIds = currentIds.filter(id => !beforeIds.includes(id))

    return newIds;
  }, {
    message: "expected a new generated image",
    timeout: 60_000
  }).toHaveLength(1);
});
