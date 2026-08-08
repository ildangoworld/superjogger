import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canUserViewInquiry,
  inquiryStatusAfterAnswer,
  isInquiryStatus,
} from "./status.ts";

describe("isInquiryStatus", () => {
  it("accepts known statuses only", () => {
    assert.equal(isInquiryStatus("OPEN"), true);
    assert.equal(isInquiryStatus("ANSWERED"), true);
    assert.equal(isInquiryStatus("CLOSED"), true);
    assert.equal(isInquiryStatus("PENDING"), false);
  });
});

describe("inquiryStatusAfterAnswer", () => {
  it("returns ANSWERED when an answer body is present", () => {
    assert.equal(inquiryStatusAfterAnswer(true), "ANSWERED");
    assert.equal(inquiryStatusAfterAnswer(false), null);
  });
});

describe("canUserViewInquiry", () => {
  it("allows only the owner", () => {
    assert.equal(canUserViewInquiry("user-a", "user-a"), true);
    assert.equal(canUserViewInquiry("user-a", "user-b"), false);
  });
});
