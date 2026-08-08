import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${part}`}
          href={match[3]}
          className="text-pine-700 underline-offset-4 hover:underline"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${part}`} className="font-semibold">
          {match[4]}
        </strong>,
      );
    }
    part += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function parseTable(rows: string[]): ReactNode {
  const cells = rows.map((row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim()),
  );
  if (cells.length < 2) {
    return null;
  }

  const header = cells[0];
  const body = cells.slice(2).filter((row) => row.some((cell) => cell.length > 0));

  return (
    <div className="border-line my-4 overflow-x-auto rounded-lg border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-fog-100 text-muted">
          <tr>
            {header.map((cell, index) => (
              <th key={`th-${index}`} className="px-3 py-2 font-medium">
                {renderInline(cell, `th-${index}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line)]">
          {body.map((row, rowIndex) => (
            <tr key={`tr-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`td-${rowIndex}-${cellIndex}`} className="px-3 py-2">
                  {renderInline(cell, `td-${rowIndex}-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.trim() === "---") {
      blocks.push(
        <hr key={`hr-${index}`} className="border-line my-6 border-t" />,
      );
      index += 1;
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const className =
        level === 1
          ? "text-pine-900 mt-2 text-2xl font-semibold"
          : level === 2
            ? "text-pine-900 mt-8 text-xl font-semibold"
            : "text-pine-900 mt-6 text-lg font-semibold";
      const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as
        | "h1"
        | "h2"
        | "h3";
      blocks.push(
        <Tag key={`h-${index}`} className={className}>
          {renderInline(text, `h-${index}`)}
        </Tag>,
      );
      index += 1;
      i += 1;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        blocks.push(<div key={`table-${index}`}>{table}</div>);
        index += 1;
      }
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim()) || /^[-*]\s+/.test(line.trim())) {
      const ordered = /^\d+\.\s+/.test(line.trim());
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        if (ordered && /^\d+\.\s+/.test(itemLine)) {
          items.push(itemLine.replace(/^\d+\.\s+/, ""));
          i += 1;
          continue;
        }
        if (!ordered && /^[-*]\s+/.test(itemLine)) {
          items.push(itemLine.replace(/^[-*]\s+/, ""));
          i += 1;
          continue;
        }
        break;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={`list-${index}`}
          className={
            ordered
              ? "text-muted mt-3 list-decimal space-y-2 pl-5 leading-7"
              : "text-muted mt-3 list-disc space-y-2 pl-5 leading-7"
          }
        >
          {items.map((item, itemIndex) => (
            <li key={`li-${index}-${itemIndex}`}>
              {renderInline(item, `li-${index}-${itemIndex}`)}
            </li>
          ))}
        </ListTag>,
      );
      index += 1;
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("|") &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      lines[i].trim() !== "---"
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className="text-muted mt-3 leading-7">
        {renderInline(paragraph.join(" "), `p-${index}`)}
      </p>,
    );
    index += 1;
  }

  return <div className="legal-markdown">{blocks}</div>;
}
