import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const axiosPost = jest.fn();
const addMock = jest.fn().mockResolvedValue({});
const collectionMock = jest.fn(() => ({ add: addMock }));

await jest.unstable_mockModule("axios", () => ({
  default: { post: axiosPost },
}));

await jest.unstable_mockModule("../utils/firebase.js", () => ({
  db: { collection: collectionMock },
}));

const { default: slant3dRoutes } = await import("../routes/slant3d.routes.js");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/slant3d", slant3dRoutes);
  return app;
};

describe("Slant3D routes", () => {
  beforeEach(() => {
    axiosPost.mockReset();
    addMock.mockClear();
    collectionMock.mockClear();
    delete process.env.SLANT_3D_API_KEY;
    delete process.env.SLANT3D_API_KEY;
  });

  it("returns 500 when API key is missing", async () => {
    const app = buildApp();
    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({
        fileUrl: "https://example.com/model.stl",
        fileName: "model.stl",
      });

    expect(response.status).toBe(500);
    expect(response.body?.message).toMatch(/api key/i);
  });

  it("rejects non-STL files for quotes", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    const app = buildApp();
    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({
        fileUrl: "https://example.com/model.obj",
        fileName: "model.obj",
      });

    expect(response.status).toBe(400);
    expect(response.body?.message).toMatch(/only stl/i);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it("submits a quote request with STL payload", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    axiosPost.mockResolvedValueOnce({ data: { total: 12 } });
    const app = buildApp();

    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({
        fileUrl: "https://example.com/model.stl",
        fileName: "model.stl",
        material: "PLA",
        color: "black",
        quantity: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
    expect(axiosPost).toHaveBeenCalledTimes(1);
    const [url, payload] = axiosPost.mock.calls[0];
    expect(url).toMatch(/order\/estimate$/);
    expect(payload).toEqual([
      {
        filename: "model.stl",
        fileURL: "https://example.com/model.stl",
        order_quantity: "2",
        order_item_color: "black",
        profile: "PLA",
      },
    ]);
  });
});
