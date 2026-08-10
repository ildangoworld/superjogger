import assert from "node:assert/strict";
import { describe, it } from "node:test";

type JoinDecision = "APPROVED" | "REJECTED";

function canDecideJoinRequest(input: {
  isOwner: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decision: JoinDecision;
}): boolean {
  return input.isOwner && input.status === "PENDING";
}

describe("crew join request decisions", () => {
  it("allows an owner to decide a pending request", () => {
    assert.equal(
      canDecideJoinRequest({
        isOwner: true,
        status: "PENDING",
        decision: "APPROVED",
      }),
      true,
    );
  });

  it("rejects decisions by non-owners", () => {
    assert.equal(
      canDecideJoinRequest({
        isOwner: false,
        status: "PENDING",
        decision: "APPROVED",
      }),
      false,
    );
  });

  it("rejects decisions on already decided requests", () => {
    assert.equal(
      canDecideJoinRequest({
        isOwner: true,
        status: "APPROVED",
        decision: "REJECTED",
      }),
      false,
    );
  });
});
