import { expect, test, type Locator } from "@playwright/test";

async function expectImageToLoad(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
}

async function expectLinkToReceiveClick(link: Locator) {
  await link.scrollIntoViewIfNeeded();
  await link.evaluate((element) => {
    element.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        element.setAttribute("data-click-received", "true");
      },
      { once: true },
    );
  });
  await link.click();
  await expect(link).toHaveAttribute("data-click-received", "true");
}

test("contact page supports customers with a working message flow", async ({ page, isMobile }) => {
  await page.goto("/");

  const essentialOnly = page.getByRole("button", { name: "Essential only" });
  await essentialOnly.waitFor({ state: "visible", timeout: 2_500 }).catch(() => undefined);
  if (await essentialOnly.isVisible()) await essentialOnly.click();

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .click();
  } else {
    await page.getByRole("contentinfo").getByRole("link", { name: "Contact", exact: true }).click();
  }

  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Get in touch", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Send us a message", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Contact information", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Find us", exact: true })).toBeVisible();

  await expectImageToLoad(page.locator(".contact-hero img"));
  await expect(
    page.getByRole("img", { name: "Stylised location map for Dhaka, Bangladesh" }),
  ).toBeVisible();

  const emailLink = page.locator('.contact-info-row a[href^="mailto:"]');
  await expect(emailLink).toHaveAttribute("href", /^mailto:.+@.+/);

  const helpTopics = [
    ["We’re Here to Help", "/faq"],
    ["Order Support", "/account/orders"],
    ["Partnerships", "/wholesale"],
    ["Wholesale Inquiries", "/wholesale"],
    ["Feedback", "#contact-form"],
  ] as const;
  const helpNavigation = page.getByRole("navigation", { name: "Contact help topics" });
  await expect(helpNavigation.getByRole("link")).toHaveCount(helpTopics.length);
  for (const [label, href] of helpTopics) {
    const link = helpNavigation.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expectLinkToReceiveClick(link);
  }

  const directions = page.getByRole("link", { name: "Get directions", exact: true });
  await expect(directions).toHaveAttribute(
    "href",
    "https://www.google.com/maps/search/?api=1&query=Dhaka%2C+Bangladesh",
  );
  await expect(directions).toHaveAttribute("target", "_blank");
  await expectLinkToReceiveClick(directions);

  const form = page.getByRole("form", { name: "Send us a message" });
  let inquiryRequests = 0;
  let submittedBody: Record<string, unknown> | undefined;
  await page.route("**/api/inquiries", async (route) => {
    inquiryRequests += 1;
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ accepted: true }),
    });
  });

  await form.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(form.locator(".field-error")).toHaveCount(4);
  expect(inquiryRequests).toBe(0);

  await form.getByRole("textbox", { name: "Full name" }).fill("Amina Rahman");
  await form.getByRole("textbox", { name: "Email address" }).fill("amina@example.com");
  await form.getByRole("textbox", { name: "Phone number" }).fill("+880 1700 000000");
  await form.getByRole("textbox", { name: "Subject" }).fill("Order question");
  await form
    .getByRole("textbox", { name: "Message" })
    .fill("Please help me check the delivery details for my order.");
  await form.getByRole("button", { name: "Send message", exact: true }).click();

  await expect(
    form.getByRole("status").filter({
      hasText: "Thank you. Your message has been received.",
    }),
  ).toBeVisible();
  expect(inquiryRequests).toBe(1);
  expect(submittedBody).toMatchObject({
    type: "contact",
    name: "Amina Rahman",
    email: "amina@example.com",
    telephone: "+880 1700 000000",
    subject: "Order question",
    message: "Please help me check the delivery details for my order.",
    website: "",
  });
  await expect(form.getByRole("textbox", { name: "Full name" })).toHaveValue("");

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Flavors and stories from Bangladesh",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" }).last()).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});
