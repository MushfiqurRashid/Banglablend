import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatBusinessOrderReference } from "./order-workflow";

export interface InvoiceLineItem {
  title: string;
  variant_title: string | null;
  sku: string | null;
  quantity: number;
  fulfilled_quantity: number;
  unit_price: number;
}

export interface InvoiceAddress {
  first_name: string;
  last_name: string;
  company: string | null;
  address_1: string;
  address_2: string | null;
  city: string;
  province: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string;
}

export interface InvoiceSeller {
  name: string;
  tagline: string;
  addressLines: string[];
  email: string | null;
  phone: string | null;
}

export interface InvoiceOrder {
  id: string;
  display_id: number;
  email: string;
  currency_code: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  canceled_at: string | null;
  created_at: string;
}

export interface InvoiceInput {
  order: InvoiceOrder;
  items: InvoiceLineItem[];
  seller: InvoiceSeller;
  billingAddress: InvoiceAddress | null;
  shippingAddress: InvoiceAddress | null;
  paymentMethod: string;
  fulfilledAt: string;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const INK = rgb(0.16, 0.13, 0.11);
const MUTED = rgb(0.42, 0.37, 0.34);
const CHILLI = rgb(0.56, 0.18, 0.12);
const GREEN = rgb(0.18, 0.34, 0.2);
const BORDER = rgb(0.84, 0.79, 0.72);
const PAPER = rgb(0.98, 0.96, 0.92);

export function canDownloadInvoice(order: Pick<InvoiceOrder, "canceled_at">, items: Pick<InvoiceLineItem, "quantity" | "fulfilled_quantity">[]) {
  return !order.canceled_at && items.length > 0 && items.every((item) => item.fulfilled_quantity >= item.quantity);
}

export function invoiceFilename(displayId: number) {
  return `invoice-${formatBusinessOrderReference(displayId)}.pdf`;
}

function pdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function money(amount: number, currencyCode: string) {
  return `${currencyCode.toUpperCase()} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = pdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawRight(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  const safe = pdfText(text);
  page.drawText(safe, { x: x - font.widthOfTextAtSize(safe, size), y, font, size, color });
}

function drawCenter(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  const safe = pdfText(text);
  page.drawText(safe, { x: x - font.widthOfTextAtSize(safe, size) / 2, y, font, size, color });
}

function drawLabel(page: PDFPage, label: string, value: string, x: number, y: number, regular: PDFFont, bold: PDFFont) {
  page.drawText(pdfText(label).toUpperCase(), { x, y, font: bold, size: 7, color: CHILLI });
  page.drawText(pdfText(value), { x, y: y - 16, font: regular, size: 10, color: INK });
}

function addressLines(address: InvoiceAddress | null, email: string) {
  if (!address) return [email];
  return [
    `${address.first_name} ${address.last_name}`,
    address.company,
    address.address_1,
    address.address_2,
    [address.city, address.province, address.postal_code].filter(Boolean).join(", "),
    address.country_code.toUpperCase(),
    address.phone,
    email,
  ].filter((line): line is string => Boolean(line));
}

export async function createInvoicePdf(input: InvoiceInput) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${formatBusinessOrderReference(input.order.display_id)}`);
  pdf.setAuthor(input.seller.name);
  pdf.setSubject("Fulfilled order invoice");
  pdf.setCreator("Bangla Blend Admin");
  pdf.setProducer("Bangla Blend Admin");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const header = () => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 18, width: PAGE_WIDTH, height: 18, color: GREEN });
    page.drawText(pdfText(input.seller.name).toUpperCase(), { x: MARGIN, y: PAGE_HEIGHT - 70, font: bold, size: 21, color: INK });
    page.drawText(pdfText(input.seller.tagline).toUpperCase(), { x: MARGIN, y: PAGE_HEIGHT - 84, font: bold, size: 7, color: CHILLI });
    drawRight(page, "INVOICE", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 69, bold, 20, CHILLI);
    drawRight(page, "FULFILLED ORDER", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 84, regular, 8, MUTED);
    page.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - 104 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 104 }, thickness: 1, color: BORDER });
  };

  header();
  y = PAGE_HEIGHT - 136;
  const reference = formatBusinessOrderReference(input.order.display_id);
  drawLabel(page, "Invoice number", `INV-${reference.toUpperCase()}`, MARGIN, y, regular, bold);
  drawLabel(page, "Order reference", reference, 188, y, regular, bold);
  drawLabel(page, "Order date", date(input.order.created_at), 337, y, regular, bold);
  drawLabel(page, "Fulfilled", date(input.fulfilledAt), 447, y, regular, bold);

  y -= 66;
  const sellerAddressLines = input.seller.addressLines.flatMap((line) => wrap(line, regular, 8.5, 270)).slice(0, 4);
  const sellerContactLines = [input.seller.email, input.seller.phone].filter((line): line is string => Boolean(line));
  page.drawRectangle({ x: MARGIN, y: y - 88, width: PAGE_WIDTH - MARGIN * 2, height: 100, color: PAPER, borderColor: BORDER, borderWidth: 0.7 });
  page.drawText("BILLED FROM", { x: MARGIN + 15, y, font: bold, size: 7, color: CHILLI });
  page.drawText(pdfText(input.seller.name), { x: MARGIN + 15, y: y - 19, font: bold, size: 10, color: INK });
  sellerAddressLines.forEach((line, index) =>
    page.drawText(line, { x: MARGIN + 15, y: y - 36 - index * 12, font: regular, size: 8.5, color: MUTED }),
  );
  if (sellerContactLines.length > 0) {
    page.drawText("CONTACT DETAILS", { x: 365, y, font: bold, size: 7, color: CHILLI });
    sellerContactLines.forEach((line, index) =>
      page.drawText(pdfText(line), { x: 365, y: y - 19 - index * 14, font: regular, size: 8.5, color: INK }),
    );
  }

  y -= 116;
  const billingLines = addressLines(input.billingAddress ?? input.shippingAddress, input.order.email);
  const shippingLines = addressLines(input.shippingAddress ?? input.billingAddress, input.order.email);
  page.drawRectangle({ x: MARGIN, y: y - 114, width: PAGE_WIDTH - MARGIN * 2, height: 126, color: PAPER, borderColor: BORDER, borderWidth: 0.7 });
  page.drawText("BILL TO", { x: MARGIN + 15, y, font: bold, size: 7, color: CHILLI });
  page.drawText("SHIP TO", { x: 311, y, font: bold, size: 7, color: CHILLI });
  billingLines
    .flatMap((line) => wrap(line, regular, 8.5, 215))
    .slice(0, 7)
    .forEach((line, index) => page.drawText(line, { x: MARGIN + 15, y: y - 17 - index * 13, font: index === 0 ? bold : regular, size: 8.5, color: index === 0 ? INK : MUTED }));
  shippingLines
    .flatMap((line) => wrap(line, regular, 8.5, 215))
    .slice(0, 7)
    .forEach((line, index) => page.drawText(line, { x: 311, y: y - 17 - index * 13, font: index === 0 ? bold : regular, size: 8.5, color: index === 0 ? INK : MUTED }));
  y -= 145;

  const columns = { item: MARGIN + 9, qty: 350, price: 455, amount: PAGE_WIDTH - MARGIN - 8 };
  const tableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 9, width: PAGE_WIDTH - MARGIN * 2, height: 25, color: GREEN });
    page.drawText("DESCRIPTION", { x: columns.item, y, font: bold, size: 7, color: rgb(1, 1, 1) });
    drawCenter(page, "QTY", columns.qty, y, bold, 7, rgb(1, 1, 1));
    drawRight(page, "UNIT PRICE", columns.price, y, bold, 7, rgb(1, 1, 1));
    drawRight(page, "AMOUNT", columns.amount, y, bold, 7, rgb(1, 1, 1));
    y -= 30;
  };
  tableHeader();

  for (const item of input.items) {
    const title = item.variant_title ? `${item.title} - ${item.variant_title}` : item.title;
    const titleLines = wrap(title, regular, 9, 255);
    const rowHeight = Math.max(42, titleLines.length * 12 + 25);
    if (y - rowHeight < 190) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      header();
      y = PAGE_HEIGHT - 135;
      tableHeader();
    }
    titleLines.forEach((line, index) => page.drawText(line, { x: columns.item, y: y - index * 12, font: index === 0 ? bold : regular, size: 9, color: INK }));
    page.drawText(pdfText(`SKU: ${item.sku || "-"}`), { x: columns.item, y: y - titleLines.length * 12 - 1, font: regular, size: 7.5, color: MUTED });
    drawCenter(page, String(item.quantity), columns.qty, y, regular, 9);
    drawRight(page, money(item.unit_price, input.order.currency_code), columns.price, y, regular, 8.5);
    drawRight(page, money(item.unit_price * item.quantity, input.order.currency_code), columns.amount, y, bold, 8.5);
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 8 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 8 }, thickness: 0.55, color: BORDER });
  }

  y -= 10;
  const totalX = 389;
  const valueX = PAGE_WIDTH - MARGIN;
  const totalRow = (label: string, amount: number, emphasize = false) => {
    page.drawText(label, { x: totalX, y, font: emphasize ? bold : regular, size: emphasize ? 10 : 8.5, color: emphasize ? INK : MUTED });
    drawRight(page, money(amount, input.order.currency_code), valueX, y, emphasize ? bold : regular, emphasize ? 10 : 8.5, emphasize ? CHILLI : INK);
    y -= emphasize ? 24 : 18;
  };
  totalRow("Subtotal", input.order.subtotal);
  totalRow("Delivery", input.order.shipping_total);
  if (input.order.tax_total > 0) totalRow("Tax", input.order.tax_total);
  page.drawLine({ start: { x: totalX, y: y + 8 }, end: { x: valueX, y: y + 8 }, thickness: 1, color: BORDER });
  totalRow("Total", input.order.total, true);

  y = Math.min(y - 10, 138);
  page.drawRectangle({ x: MARGIN, y: y - 5, width: PAGE_WIDTH - MARGIN * 2, height: 54, color: PAPER });
  page.drawText("PAYMENT", { x: MARGIN + 13, y: y + 29, font: bold, size: 7, color: CHILLI });
  page.drawText(pdfText(input.paymentMethod), { x: MARGIN + 13, y: y + 12, font: regular, size: 9, color: INK });
  page.drawText("STATUS", { x: 310, y: y + 29, font: bold, size: 7, color: CHILLI });
  page.drawText(pdfText(`${input.order.payment_status.replaceAll("_", " ")} / ${input.order.fulfillment_status.replaceAll("_", " ")}`), { x: 310, y: y + 12, font: regular, size: 9, color: INK });

  page.drawText(pdfText(`Thank you for choosing ${input.seller.name}.`), { x: MARGIN, y: 54, font: italic, size: 9, color: MUTED });
  drawRight(page, `Invoice for ${reference}`, PAGE_WIDTH - MARGIN, 54, regular, 8, MUTED);
  page.drawLine({ start: { x: MARGIN, y: 70 }, end: { x: PAGE_WIDTH - MARGIN, y: 70 }, thickness: 0.7, color: BORDER });

  return pdf.save();
}
