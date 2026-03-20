import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-github-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const decodeBase64Utf8 = (value: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\n/g, "")), (char) => char.charCodeAt(0)));

const encodeBase64Utf8 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const githubToken = req.headers.get("x-github-token");
    if (!githubToken) {
      return new Response(JSON.stringify({ error: "GitHub token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    const githubHeaders = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    let response: Response;

    switch (action) {
      case "check-scopes": {
        response = await fetch("https://api.github.com/user", {
          headers: githubHeaders,
        });
        const scopes = response.headers.get("x-oauth-scopes") || "";
        const userData = await response.json();
        if (!response.ok) {
          return new Response(JSON.stringify({ error: userData.message || "Invalid token" }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ scopes, user: userData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-user": {
        response = await fetch("https://api.github.com/user", {
          headers: githubHeaders,
        });
        break;
      }

      case "fetch-repos": {
        response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
          headers: githubHeaders,
        });
        break;
      }

      case "get-repo": {
        const { owner, repo } = params;
        response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: githubHeaders,
        });
        break;
      }

      case "create-repo": {
        const { name, description, isPrivate } = params;
        response = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: githubHeaders,
          body: JSON.stringify({
            name,
            description: description || `Repository for Lua scripts`,
            private: isPrivate ?? false,
            auto_init: true,
          }),
        });
        break;
      }

      case "list-branches": {
        const { owner, repo } = params;
        response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
          headers: githubHeaders,
        });
        break;
      }

      case "create-branch": {
        const { owner, repo, branch, fromBranch } = params;
        const sourceBranchResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
          { headers: githubHeaders },
        );

        const sourceBranch = await sourceBranchResponse.json();
        if (!sourceBranchResponse.ok) {
          return new Response(JSON.stringify({ error: sourceBranch.message || "Failed to resolve source branch" }), {
            status: sourceBranchResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: "POST",
          headers: githubHeaders,
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: sourceBranch.object.sha,
          }),
        });
        break;
      }

      case "upload-file": {
        const { owner, repo, path, content, message, branch, sha: expectedSha } = params;
        let sha: string | undefined;
        try {
          const existingFile = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ""}`,
            { headers: githubHeaders }
          );
          if (existingFile.ok) {
            const data = await existingFile.json();
            sha = data.sha;
          }
        } catch { /* file doesn't exist */ }

        if (expectedSha && sha && expectedSha !== sha) {
          return new Response(JSON.stringify({
            error: "The file changed on the remote branch. Refresh before overwriting.",
            code: "REMOTE_CONFLICT",
            expectedSha,
            actualSha: sha,
          }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body: Record<string, string> = {
          message: message || `Upload ${path}`,
          content: encodeBase64Utf8(String(content ?? "")),
        };
        if (sha) body.sha = sha;
        if (branch) body.branch = String(branch);

        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            method: "PUT",
            headers: githubHeaders,
            body: JSON.stringify(body),
          }
        );
        break;
      }

      case "list-files": {
        const { owner, repo, path, ref } = params;
        const filePath = path ? `/${path}` : "";
        const query = ref ? `?ref=${encodeURIComponent(String(ref))}` : "";
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents${filePath}${query}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "get-file": {
        const { owner, repo, path, ref } = params;
        const query = ref ? `?ref=${encodeURIComponent(String(ref))}` : "";
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}${query}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "delete-file": {
        const { owner, repo, path, sha, message, branch } = params;
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            method: "DELETE",
            headers: githubHeaders,
            body: JSON.stringify({
              message: message || `Delete ${path}`,
              sha,
              branch,
            }),
          }
        );
        break;
      }

      case "list-commits": {
        const { owner, repo, path, sha } = params;
        const query = new URLSearchParams();
        if (path) query.set("path", String(path));
        if (sha) query.set("sha", String(sha));
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits${query.toString() ? `?${query}` : ""}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "get-commit-file": {
        const { owner, repo, path, ref } = params;
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "compare-file": {
        const { owner, repo, path, base, head } = params;
        const [baseResponse, headResponse] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(String(base))}`, {
            headers: githubHeaders,
          }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(String(head))}`, {
            headers: githubHeaders,
          }),
        ]);

        const baseJson = await baseResponse.json();
        const headJson = await headResponse.json();

        if (!baseResponse.ok || !headResponse.ok) {
          return new Response(JSON.stringify({
            error: baseJson.message || headJson.message || "Unable to compare file versions",
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          base: decodeBase64Utf8(baseJson.content ?? ""),
          head: decodeBase64Utf8(headJson.content ?? ""),
          baseSha: baseJson.sha,
          headSha: headJson.sha,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = data.message || "GitHub API error";
      if (response.status === 403 && errorMsg.includes("Resource not accessible")) {
        errorMsg = "المفتاح لا يملك الصلاحيات المطلوبة. تأكد من تفعيل صلاحية repo في إعدادات المفتاح.";
      }
      return new Response(JSON.stringify({ error: errorMsg, details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
