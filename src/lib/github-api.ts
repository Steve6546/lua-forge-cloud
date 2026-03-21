import { supabase } from "@/integrations/supabase/client";

const callGitHub = async (token: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("github-proxy", {
    headers: { "x-github-token": token },
    body,
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

export const checkScopes = (token: string) =>
  callGitHub(token, { action: "check-scopes" });

export const getUser = (token: string) =>
  callGitHub(token, { action: "get-user" });

export const fetchRepos = (token: string) =>
  callGitHub(token, { action: "fetch-repos" });

export const createRepo = (token: string, name: string, isPrivate: boolean) =>
  callGitHub(token, { action: "create-repo", name, isPrivate });

export const uploadFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message?: string,
  branch?: string
) =>
  callGitHub(token, {
    action: "upload-file",
    owner,
    repo,
    path,
    content: btoa(unescape(encodeURIComponent(content))),
    message,
    branch,
  });

export const listFiles = (token: string, owner: string, repo: string, path?: string, branch?: string) =>
  callGitHub(token, { action: "list-files", owner, repo, path, branch });

export const getFile = (token: string, owner: string, repo: string, path: string, branch?: string) =>
  callGitHub(token, { action: "get-file", owner, repo, path, branch });

export const deleteFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message?: string
) =>
  callGitHub(token, { action: "delete-file", owner, repo, path, sha, message });

export const listCommits = (token: string, owner: string, repo: string, path?: string) =>
  callGitHub(token, { action: "list-commits", owner, repo, path });

export const getCommitFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string
) =>
  callGitHub(token, { action: "get-commit-file", owner, repo, path, ref });

export const listBranches = (token: string, owner: string, repo: string) =>
  callGitHub(token, { action: "list-branches", owner, repo });

// Create folder by uploading a .gitkeep placeholder
export const createFolder = (
  token: string,
  owner: string,
  repo: string,
  folderPath: string,
  branch?: string
) =>
  callGitHub(token, {
    action: "upload-file",
    owner,
    repo,
    path: `${folderPath}/.gitkeep`,
    content: btoa(""),
    message: `Create folder ${folderPath}`,
    branch,
  });
