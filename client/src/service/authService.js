import axios from "axios";
import { getToken } from "../config/config/helpers";
import config from "../config/config/config";

const token = getToken();

export const AuthService = axios.create({
  baseURL: config.authService,
  headers: {
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
    Authorization: `Bearer ${token}`,
  },
});
