import { defineConfig } from "vite";

function resolveBasePath() {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }

  if (process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_REPOSITORY) {
    const [, repoName] = process.env.GITHUB_REPOSITORY.split("/");
    return repoName ? `/${repoName}/` : "/";
  }

  return "/";
}

export default defineConfig({
  base: resolveBasePath(),
});
