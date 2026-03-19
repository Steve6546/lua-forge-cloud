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
  message?: string
) =>
  callGitHub(token, {
    action: "upload-file",
    owner,
    repo,
    path,
    content: btoa(unescape(encodeURIComponent(content))),
    message,
  });
