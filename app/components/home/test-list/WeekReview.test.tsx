import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { buildReviewChip } from "#mocks/factories/views";
import { renderRoute } from "#tests/helpers/render";
import { WeekReview } from "./WeekReview";

/** Two patterns, the first of which the button marks reviewed, as the list does once the server has saved the mark. */
function Marking() {
  const [marked, setMarked] = useState(false);
  const items = [
    { chip: buildReviewChip({ grammarId: "g1", pattern: "〜かける", number: 1, reviewed: marked }), targets: [] },
    { chip: buildReviewChip({ grammarId: "g2", pattern: "〜切る", number: 2 }), targets: [] },
  ];
  return (
    <>
      <button onClick={() => setMarked(true)}>Save the mark</button>
      <WeekReview items={items} />
    </>
  );
}

const chips = async () => within(await screen.findByRole("region", { name: /Grammar to review/ })).getAllByRole("button").map((chip) => chip.textContent);

describe("WeekReview", () => {
  it("keeps a chip marked reviewed where it is, turning it green and counting it, until the page is shown again", async () => {
    renderRoute(<Marking />);
    expect(await chips()).toEqual(["〜かける", "〜切る"]);

    await userEvent.click(screen.getByRole("button", { name: "Save the mark" }));

    expect(await chips()).toEqual(["〜かける(reviewed)", "〜切る"]);
    expect(screen.getByRole("heading", { name: /Grammar to review/ })).toHaveTextContent("1 / 2 left");
  });
});
