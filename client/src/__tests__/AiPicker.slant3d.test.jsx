import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.mock("../components/MeshyPreview.jsx", () => () => (
  <div data-testid="meshy-preview" />
));

const { default: AiPicker } = require("../components/AiPicker.jsx");

const baseProps = {
  mode: "meshy",
  prompt: "A 3D boot",
  setPrompt: () => {},
  onMeshySubmit: () => {},
  meshyTask: { task_id: "task-1", status: "succeeded", progress: 100 },
};

describe("AiPicker Slant3D flow", () => {
  it("disables the quote button when no STL is available", () => {
    render(<AiPicker {...baseProps} meshyStlUrl="" />);

    const quoteButton = screen.getByRole("button", {
      name: /get 3d printing quote/i,
    });

    expect(quoteButton).toBeDisabled();
  });

  it("enables the quote button when an STL is available", () => {
    render(<AiPicker {...baseProps} meshyStlUrl="https://assets.meshy.ai/test.stl" />);

    const quoteButton = screen.getByRole("button", {
      name: /get 3d printing quote/i,
    });

    expect(quoteButton).toBeEnabled();
  });

  it("shows the STL processing indicator when the model is ready but STL is not", () => {
    render(
      <AiPicker
        {...baseProps}
        meshyStlUrl=""
        meshyTask={{ task_id: "task-2", status: "succeeded", progress: 100 }}
      />,
    );

    expect(
      screen.getByText(/stl is processing/i),
    ).toBeInTheDocument();
  });
});
