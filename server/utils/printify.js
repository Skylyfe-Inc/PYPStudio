import fetch from "node-fetch";

const BASE_URL = process.env.PRINTIFY_BASE_URL || "https://api.printify.com/v1";

const getAccessToken = () => {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new Error("PRINTIFY_API_TOKEN is not configured");
  }
  return token;
};

export const printifyGet = async (path) => {
  const token = getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText;
    const error = new Error(message || "Printify request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
