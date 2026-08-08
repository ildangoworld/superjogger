import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  idsToArchiveOnPublish,
  isLegalDocumentEditable,
  listPublicLegalHistory,
  nextLegalVersion,
  resolveEffectiveLegalDocument,
} from "./publish.ts";

describe("isLegalDocumentEditable", () => {
  it("allows editing drafts only", () => {
    assert.equal(isLegalDocumentEditable("DRAFT"), true);
    assert.equal(isLegalDocumentEditable("PUBLISHED"), false);
    assert.equal(isLegalDocumentEditable("ARCHIVED"), false);
  });
});

describe("resolveEffectiveLegalDocument", () => {
  const docs = [
    {
      id: "1",
      docType: "TERMS" as const,
      version: 1,
      status: "ARCHIVED" as const,
      effectiveDate: "2026-01-01",
    },
    {
      id: "2",
      docType: "TERMS" as const,
      version: 2,
      status: "PUBLISHED" as const,
      effectiveDate: "2026-06-01",
    },
    {
      id: "3",
      docType: "TERMS" as const,
      version: 3,
      status: "PUBLISHED" as const,
      effectiveDate: "2026-12-01",
    },
    {
      id: "d",
      docType: "TERMS" as const,
      version: 4,
      status: "DRAFT" as const,
      effectiveDate: null,
    },
  ];

  it("picks the highest version whose effective date is on or before today", () => {
    const current = resolveEffectiveLegalDocument(docs, "TERMS", "2026-08-08");
    assert.equal(current?.id, "2");
  });

  it("switches to a scheduled version once its effective date arrives", () => {
    const current = resolveEffectiveLegalDocument(docs, "TERMS", "2026-12-01");
    assert.equal(current?.id, "3");
  });

  it("returns null when nothing is effective yet", () => {
    const current = resolveEffectiveLegalDocument(docs, "PRIVACY", "2026-08-08");
    assert.equal(current, null);
  });
});

describe("listPublicLegalHistory", () => {
  it("excludes drafts and the current version", () => {
    const history = listPublicLegalHistory(
      [
        {
          id: "1",
          docType: "PRIVACY" as const,
          version: 1,
          status: "ARCHIVED" as const,
          effectiveDate: "2026-01-01",
        },
        {
          id: "2",
          docType: "PRIVACY" as const,
          version: 2,
          status: "PUBLISHED" as const,
          effectiveDate: "2026-06-01",
        },
        {
          id: "3",
          docType: "PRIVACY" as const,
          version: 3,
          status: "DRAFT" as const,
          effectiveDate: null,
        },
      ],
      "PRIVACY",
      2,
    );
    assert.deepEqual(
      history.map((doc) => doc.id),
      ["1"],
    );
  });
});

describe("nextLegalVersion", () => {
  it("increments from the highest existing version", () => {
    assert.equal(nextLegalVersion([], "TERMS"), 1);
    assert.equal(
      nextLegalVersion(
        [
          { docType: "TERMS", version: 1 },
          { docType: "TERMS", version: 3 },
          { docType: "PRIVACY", version: 9 },
        ],
        "TERMS",
      ),
      4,
    );
  });
});

describe("idsToArchiveOnPublish", () => {
  it("archives published docs that are superseded on or before the new date", () => {
    const ids = idsToArchiveOnPublish(
      [
        {
          id: "old",
          docType: "TERMS",
          version: 1,
          status: "PUBLISHED",
          effectiveDate: "2026-01-01",
        },
        {
          id: "future",
          docType: "TERMS",
          version: 2,
          status: "PUBLISHED",
          effectiveDate: "2026-12-01",
        },
        {
          id: "new",
          docType: "TERMS",
          version: 3,
          status: "DRAFT",
          effectiveDate: "2026-08-08",
        },
      ],
      { id: "new", docType: "TERMS", effectiveDate: "2026-08-08" },
    );
    assert.deepEqual(ids, ["old"]);
  });
});
