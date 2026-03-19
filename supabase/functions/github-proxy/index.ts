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
        // Check if file exists first to get sha for updates
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
        } catch { /* file doesn't exist, that's fine */ }

        const body: Record<string, string> = {
          message: message || `Upload ${path}`,
          content, // already base64 from client
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

      case "get-user": {
        response = await fetch("https://api.github.com/user", {
          headers: githubHeaders,
        });
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
      return new Response(JSON.stringify({ error: data.message || "GitHub API error", details: data }), {
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
