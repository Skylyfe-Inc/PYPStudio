import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const axiosMock = jest.fn();
const addMock = jest.fn().mockResolvedValue({});
const collectionMock = jest.fn(() => ({ add: addMock }));

await jest.unstable_mockModule("axios", () => ({
  default: axiosMock,
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
    axiosMock.mockReset();
    addMock.mockClear();
    collectionMock.mockClear();
    delete process.env.SLANT_3D_API_KEY;
    delete process.env.SLANT3D_API_KEY;
  });

  it("returns 500 when API key is missing", async () => {
    const app = buildApp();
    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({ fileName: "model.stl" });

    expect(response.status).toBe(500);
    expect(response.body?.message).toMatch(/api key/i);
  });

  it("rejects missing v2 identifiers for quotes", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    const app = buildApp();
    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({
        fileName: "model.stl",
      });

    expect(response.status).toBe(400);
    expect(response.body?.message).toMatch(/publicfileserviceid/i);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  it("submits a v2 quote request with required payload", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    axiosMock.mockResolvedValueOnce({ data: { order: { publicId: "SLANT_123" } } });
    const app = buildApp();

    const response = await request(app)
      .post("/api/v1/slant3d/quote")
      .send({
        fileName: "model.stl",
        quantity: 2,
        publicFileServiceId: "file-123",
        filamentId: "fil-123",
        platformId: "platform-123",
      });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
    expect(axiosMock).toHaveBeenCalledTimes(1);
    const [requestConfig] = axiosMock.mock.calls[0];
    expect(requestConfig.url).toMatch(/\\/orders$/);
    expect(requestConfig.headers.Authorization).toMatch(/Bearer/);
    expect(requestConfig.data.items[0]).toMatchObject({
      type: "PRINT",
      publicFileServiceId: "file-123",
      filamentId: "fil-123",
      quantity: 2,
      name: "model.stl",
    });
  });

  it("uploads a file to Slant3D using the server upload endpoint", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    axiosMock.mockResolvedValueOnce({ data: { data: { publicFileServiceId: "pf-1" } } });
    const app = buildApp();

    const response = await request(app)
      .post("/api/v1/slant3d/files/upload")
      .send({
        fileUrl: "https://example.com/model.stl",
        fileName: "model.stl",
        platformId: "platform-123",
      });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
    const [requestConfig] = axiosMock.mock.calls[0];
    expect(requestConfig.url).toMatch(/\\/files$/);
    expect(requestConfig.data).toMatchObject({
      url: "https://example.com/model.stl",
      name: "model.stl",
      platformId: "platform-123",
    });
  });

  it("returns 400 when order creation is missing IDs", async () => {
    process.env.SLANT_3D_API_KEY = "test-key";
    const app = buildApp();
    const response = await request(app)
      .post("/api/v1/slant3d/order")
      .send({ fileName: "model.stl", quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body?.message).toMatch(/publicfileserviceid/i);
  });
});
