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
  slantPlatformId: "platform-1",
  slantFilamentId: "filament-1",
  slantContact: { name: "Test User", email: "test@example.com", phone: "" },
  slantShipping: {
    street: "123 Main",
    city: "City",
    state: "ST",
    zip: "12345",
    country: "US",
    isUSResidential: true,
  },
};

describe("AiPicker Slant3D flow", () => {
  it("disables the quote button when no STL is available", () => {
    render(<AiPicker {...baseProps} meshyStlUrl="" />);

    const quoteButton = screen.getByRole("button", {
      name: /get 3d printing quote/i,
    });

    expect(quoteButton).toBeDisabled();
  });

  it("enables the quote button when requirements are met", () => {
    render(<AiPicker {...baseProps} meshyStlUrl="https://assets.meshy.ai/test.stl" />);

    const quoteButton = screen.getByRole("button", {
      name: /get 3d printing quote/i,
    });

    expect(quoteButton).toBeEnabled();
  });

  it("shows the STL not ready status when the model is ready but STL is not", () => {
    render(
      <AiPicker
        {...baseProps}
        meshyStlUrl=""
        meshyTask={{ task_id: "task-2", status: "succeeded", progress: 100 }}
      />,
    );

    expect(
      screen.getByText(/stl not ready yet/i),
    ).toBeInTheDocument();
  });
});
