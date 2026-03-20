export type LoaderFile = {
  path: string;
};

export type LoaderMode = "standard" | "obfuscated" | "multi-file";

export const buildRawUrl = (owner: string, repo: string, branch: string, path: string) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

const obfuscateString = (value: string) =>
  value
    .split("")
    .map((char) => char.charCodeAt(0))
    .join(",");

export const generateLoader = ({
  owner,
  repo,
  branch,
  files,
  mode,
}: {
  owner: string;
  repo: string;
  branch: string;
  files: LoaderFile[];
  mode: LoaderMode;
}) => {
  const mainFile = files.find((file) => file.path.endsWith("main.lua")) ?? files[0];
  const manifest = files.map((file) => ({
    name: file.path.replace(/\.lua$/i, ""),
    path: file.path,
    url: buildRawUrl(owner, repo, branch, file.path),
  }));

  if (!mainFile) {
    return "";
  }

  const mainUrl = buildRawUrl(owner, repo, branch, mainFile.path);

  if (mode === "standard") {
    return `loadstring(game:HttpGet("${mainUrl}?v=" .. tostring(os.time())))()`;
  }

  if (mode === "obfuscated") {
    return [
      "local function _d(bytes)",
      "  local chars = {}",
      "  for value in string.gmatch(bytes, '[^,]+') do",
      "    table.insert(chars, string.char(tonumber(value)))",
      "  end",
      "  return table.concat(chars)",
      "end",
      `local url = _d("${obfuscateString(mainUrl)}")`,
      "loadstring(game:HttpGet(url .. '?v=' .. tostring(os.time())))()",
    ].join("\n");
  }

  return [
    "local manifest = {",
    ...manifest.map((file) => `  ["${file.name}"] = "${file.url}",`),
    "}",
    "local cache = {}",
    "local function import(name)",
    "  if cache[name] then",
    "    return cache[name]",
    "  end",
    "  local source = game:HttpGet(manifest[name] .. '?v=' .. tostring(os.time()))",
    "  local moduleFactory = loadstring(source)",
    "  cache[name] = moduleFactory()",
    "  return cache[name]",
    "end",
    `return import("${mainFile.path.replace(/\.lua$/i, "")}")`,
  ].join("\n");
};
