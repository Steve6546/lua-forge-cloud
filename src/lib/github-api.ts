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

export const getRepo = (token: string, owner: string, repo: string) =>
  callGitHub(token, { action: "get-repo", owner, repo });

export const createRepo = (token: string, name: string, isPrivate: boolean) =>
  callGitHub(token, { action: "create-repo", name, isPrivate });

export const listBranches = (token: string, owner: string, repo: string) =>
  callGitHub(token, { action: "list-branches", owner, repo });

export const createBranch = (
  token: string,
  owner: string,
  repo: string,
  branch: string,
  fromBranch: string,
) =>
  callGitHub(token, { action: "create-branch", owner, repo, branch, fromBranch });

export const uploadFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message?: string,
  branch?: string,
  sha?: string,
) =>
  callGitHub(token, {
    action: "upload-file",
    owner,
    repo,
    path,
    content,
    message,
    branch,
    sha,
  });

export const listFiles = (token: string, owner: string, repo: string, path?: string, ref?: string) =>
  callGitHub(token, { action: "list-files", owner, repo, path, ref });

export const getFile = (token: string, owner: string, repo: string, path: string, ref?: string) =>
  callGitHub(token, { action: "get-file", owner, repo, path, ref });

export const deleteFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message?: string,
  branch?: string,
) => callGitHub(token, { action: "delete-file", owner, repo, path, sha, message, branch });

export const listCommits = (token: string, owner: string, repo: string, path?: string, sha?: string) =>
  callGitHub(token, { action: "list-commits", owner, repo, path, sha });

export const getCommitFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
) =>
  callGitHub(token, { action: "get-commit-file", owner, repo, path, ref });

export const compareFile = (
  token: string,
  owner: string,
  repo: string,
  path: string,
  base: string,
  head: string,
) => callGitHub(token, { action: "compare-file", owner, repo, path, base, head });
