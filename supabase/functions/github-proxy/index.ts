import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-github-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

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

      case "upload-file": {
        const { owner, repo, path, content, message } = params;
        let sha: string | undefined;
        try {
          const existingFile = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            { headers: githubHeaders }
          );
          if (existingFile.ok) {
            const data = await existingFile.json();
            sha = data.sha;
          }
        } catch { /* file doesn't exist */ }

        const body: Record<string, string> = {
          message: message || `Upload ${path}`,
          content,
        };
        if (sha) body.sha = sha;

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
        const { owner, repo, path } = params;
        const filePath = path ? `/${path}` : "";
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents${filePath}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "get-file": {
        const { owner, repo, path } = params;
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          { headers: githubHeaders }
        );
        break;
      }

      case "delete-file": {
        const { owner, repo, path, sha, message } = params;
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            method: "DELETE",
            headers: githubHeaders,
            body: JSON.stringify({
              message: message || `Delete ${path}`,
              sha,
            }),
          }
        );
        break;
      }

      case "list-commits": {
        const { owner, repo, path } = params;
        const query = path ? `?path=${encodeURIComponent(path)}` : "";
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits${query}`,
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
