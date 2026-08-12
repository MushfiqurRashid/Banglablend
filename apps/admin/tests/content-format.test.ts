import { describe, expect, it } from "vitest";
import { plainTextToPortableText, portableTextToPlainText } from "../src/lib/content-format";

describe("content formatting", () => {
  it("stores plain paragraphs as portable text", () => {
    const value = plainTextToPortableText("First paragraph.\n\nSecond paragraph.");

    expect(value).toHaveLength(2);
    expect(value[0]?.children[0]?.text).toBe("First paragraph.");
    expect(value[1]?.children[0]?.text).toBe("Second paragraph.");
  });

  it("presents portable text as normal paragraphs", () => {
    expect(
      portableTextToPlainText([
        { _type: "block", children: [{ _type: "span", text: "First" }, { _type: "span", text: " paragraph." }] },
        { _type: "block", children: [{ _type: "span", text: "Second paragraph." }] },
      ]),
    ).toBe("First paragraph.\n\nSecond paragraph.");
  });
});
