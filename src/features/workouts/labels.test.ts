import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatConditionScore,
  formatPerceivedExertion,
} from "./labels.ts";

describe("workout score labels", () => {
  it("formats perceived exertion as Korean phrases", () => {
    assert.equal(formatPerceivedExertion(1), "아주 쉬움");
    assert.equal(formatPerceivedExertion(3), "보통");
    assert.equal(formatPerceivedExertion(5), "아주 힘듦");
    assert.equal(formatPerceivedExertion(3.4), "보통");
    assert.equal(formatPerceivedExertion(3.6), "힘듦");
  });

  it("formats condition score as Korean phrases", () => {
    assert.equal(formatConditionScore(1), "아주 나쁨");
    assert.equal(formatConditionScore(4), "좋음");
    assert.equal(formatConditionScore(5), "매우 좋음");
    assert.equal(formatConditionScore(2.4), "나쁨");
  });
});
