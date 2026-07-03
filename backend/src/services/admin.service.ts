import fs from "fs";
import path from "path";

const adminFilePath = path.join(__dirname, "../data/admin.json");

export const getAdminCredentials = () => {
  // Always prioritize environment variables first (safest for cloud deploys)
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    };
  }

  try {
    const data = fs.readFileSync(adminFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { username: "admin", password: "password" };
  }
};

export const updateAdminCredentials = (username?: string, password?: string) => {
  const current = getAdminCredentials();
  const updated = {
    username: username || current.username,
    password: password || current.password,
  };
  fs.writeFileSync(adminFilePath, JSON.stringify(updated, null, 2));
  return updated;
};
