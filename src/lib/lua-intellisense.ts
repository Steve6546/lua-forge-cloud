// Roblox API definitions for Monaco IntelliSense
export interface APIEntry {
  label: string;
  kind: number; // monaco.languages.CompletionItemKind
  detail: string;
  documentation: string;
  insertText: string;
}

// Roblox global services & objects
export const ROBLOX_GLOBALS: APIEntry[] = [
  { label: "game", kind: 5, detail: "DataModel", documentation: "The root object of the Roblox game hierarchy. Access services like Players, Workspace, etc.", insertText: "game" },
  { label: "workspace", kind: 5, detail: "Workspace", documentation: "The Workspace service containing all physical objects in the game world.", insertText: "workspace" },
  { label: "script", kind: 5, detail: "Script", documentation: "Reference to the currently executing script.", insertText: "script" },
  { label: "game:GetService", kind: 1, detail: "(serviceName: string) → Instance", documentation: "Returns the service with the given name.", insertText: 'game:GetService("${1:Players}")' },
  { label: "game:HttpGet", kind: 1, detail: "(url: string) → string", documentation: "Fetches content from a URL. Used in executors.", insertText: 'game:HttpGet("${1:url}")' },
  { label: "Instance.new", kind: 1, detail: "(className: string, parent?: Instance) → Instance", documentation: "Creates a new Instance of the given class.", insertText: 'Instance.new("${1:Part}", ${2:workspace})' },
  { label: "Players", kind: 5, detail: "Players Service", documentation: "Service for managing players in the game.", insertText: 'game:GetService("Players")' },
  { label: "ReplicatedStorage", kind: 5, detail: "ReplicatedStorage Service", documentation: "Storage replicated to all clients.", insertText: 'game:GetService("ReplicatedStorage")' },
  { label: "ServerStorage", kind: 5, detail: "ServerStorage Service", documentation: "Server-only storage for assets.", insertText: 'game:GetService("ServerStorage")' },
  { label: "TweenService", kind: 5, detail: "TweenService", documentation: "Service for creating smooth animations/tweens.", insertText: 'game:GetService("TweenService")' },
  { label: "UserInputService", kind: 5, detail: "UserInputService", documentation: "Service for detecting user input.", insertText: 'game:GetService("UserInputService")' },
  { label: "RunService", kind: 5, detail: "RunService", documentation: "Service for per-frame game logic.", insertText: 'game:GetService("RunService")' },
  { label: "Debris", kind: 5, detail: "Debris Service", documentation: "Service for scheduling Instance destruction.", insertText: 'game:GetService("Debris")' },
  { label: "HttpService", kind: 5, detail: "HttpService", documentation: "Service for HTTP requests and JSON encoding.", insertText: 'game:GetService("HttpService")' },
];

// Common Roblox instance methods
export const ROBLOX_METHODS: APIEntry[] = [
  { label: "FindFirstChild", kind: 1, detail: "(name: string, recursive?: boolean) → Instance?", documentation: "Finds the first child with the given name.", insertText: 'FindFirstChild("${1:name}")' },
  { label: "FindFirstChildOfClass", kind: 1, detail: "(className: string) → Instance?", documentation: "Finds the first child of the given class.", insertText: 'FindFirstChildOfClass("${1:Part}")' },
  { label: "WaitForChild", kind: 1, detail: "(name: string, timeout?: number) → Instance", documentation: "Waits for a child with the given name to exist.", insertText: 'WaitForChild("${1:name}")' },
  { label: "GetChildren", kind: 1, detail: "() → {Instance}", documentation: "Returns an array of all children.", insertText: "GetChildren()" },
  { label: "GetDescendants", kind: 1, detail: "() → {Instance}", documentation: "Returns an array of all descendants.", insertText: "GetDescendants()" },
  { label: "Clone", kind: 1, detail: "() → Instance", documentation: "Creates a copy of the instance and its descendants.", insertText: "Clone()" },
  { label: "Destroy", kind: 1, detail: "() → void", documentation: "Removes the instance and all its descendants.", insertText: "Destroy()" },
  { label: "IsA", kind: 1, detail: "(className: string) → boolean", documentation: "Returns true if the instance is of the given class.", insertText: 'IsA("${1:BasePart}")' },
  { label: "SetAttribute", kind: 1, detail: "(name: string, value: any) → void", documentation: "Sets a custom attribute.", insertText: 'SetAttribute("${1:name}", ${2:value})' },
  { label: "GetAttribute", kind: 1, detail: "(name: string) → any", documentation: "Gets a custom attribute value.", insertText: 'GetAttribute("${1:name}")' },
];

// Common Roblox properties
export const ROBLOX_PROPERTIES: APIEntry[] = [
  { label: "Parent", kind: 9, detail: "Instance?", documentation: "The parent of this instance.", insertText: "Parent" },
  { label: "Name", kind: 9, detail: "string", documentation: "The name of this instance.", insertText: "Name" },
  { label: "Position", kind: 9, detail: "Vector3", documentation: "The position in 3D space.", insertText: "Position" },
  { label: "CFrame", kind: 9, detail: "CFrame", documentation: "The coordinate frame of the part.", insertText: "CFrame" },
  { label: "Size", kind: 9, detail: "Vector3", documentation: "The size of the part.", insertText: "Size" },
  { label: "Color", kind: 9, detail: "Color3", documentation: "The color of the part.", insertText: "Color" },
  { label: "Transparency", kind: 9, detail: "number", documentation: "The transparency (0 = opaque, 1 = invisible).", insertText: "Transparency" },
  { label: "Anchored", kind: 9, detail: "boolean", documentation: "Whether the part is anchored in place.", insertText: "Anchored" },
  { label: "CanCollide", kind: 9, detail: "boolean", documentation: "Whether the part can collide with others.", insertText: "CanCollide" },
  { label: "BrickColor", kind: 9, detail: "BrickColor", documentation: "The BrickColor of the part.", insertText: "BrickColor" },
  { label: "Material", kind: 9, detail: "Enum.Material", documentation: "The material of the part.", insertText: "Material" },
  { label: "Humanoid", kind: 9, detail: "Humanoid", documentation: "The Humanoid of a character.", insertText: "Humanoid" },
  { label: "Character", kind: 9, detail: "Model?", documentation: "The character model of a player.", insertText: "Character" },
  { label: "LocalPlayer", kind: 9, detail: "Player", documentation: "The local player (client only).", insertText: "LocalPlayer" },
];

// Lua standard library
export const LUA_STDLIB: APIEntry[] = [
  { label: "print", kind: 1, detail: "(...any) → void", documentation: "Prints values to the output.", insertText: "print(${1})" },
  { label: "warn", kind: 1, detail: "(...any) → void", documentation: "Prints a warning to the output.", insertText: "warn(${1})" },
  { label: "error", kind: 1, detail: "(message: string, level?: number) → never", documentation: "Throws an error.", insertText: 'error("${1:message}")' },
  { label: "type", kind: 1, detail: "(v: any) → string", documentation: "Returns the type of a value.", insertText: "type(${1})" },
  { label: "typeof", kind: 1, detail: "(v: any) → string", documentation: "Roblox enhanced type checking.", insertText: "typeof(${1})" },
  { label: "tostring", kind: 1, detail: "(v: any) → string", documentation: "Converts a value to string.", insertText: "tostring(${1})" },
  { label: "tonumber", kind: 1, detail: "(v: any) → number?", documentation: "Converts a value to number.", insertText: "tonumber(${1})" },
  { label: "pcall", kind: 1, detail: "(f: function, ...any) → (boolean, ...any)", documentation: "Protected call - catches errors.", insertText: "pcall(function()\n\t${1}\nend)" },
  { label: "xpcall", kind: 1, detail: "(f: function, err: function, ...any) → (boolean, ...any)", documentation: "Protected call with error handler.", insertText: "xpcall(function()\n\t${1}\nend, function(err)\n\twarn(err)\nend)" },
  { label: "wait", kind: 1, detail: "(seconds?: number) → number", documentation: "Yields the current thread.", insertText: "wait(${1:1})" },
  { label: "task.wait", kind: 1, detail: "(seconds?: number) → number", documentation: "Modern wait replacement.", insertText: "task.wait(${1:1})" },
  { label: "task.spawn", kind: 1, detail: "(f: function, ...any) → thread", documentation: "Spawns a new thread immediately.", insertText: "task.spawn(function()\n\t${1}\nend)" },
  { label: "task.delay", kind: 1, detail: "(seconds: number, f: function, ...any) → thread", documentation: "Spawns a thread after delay.", insertText: "task.delay(${1:1}, function()\n\t${2}\nend)" },
  { label: "spawn", kind: 1, detail: "(f: function) → void", documentation: "Legacy thread spawning.", insertText: "spawn(function()\n\t${1}\nend)" },
  { label: "delay", kind: 1, detail: "(seconds: number, f: function) → void", documentation: "Legacy delayed execution.", insertText: "delay(${1:1}, function()\n\t${2}\nend)" },
  { label: "require", kind: 1, detail: "(module: ModuleScript) → any", documentation: "Loads a ModuleScript.", insertText: "require(${1})" },
  { label: "loadstring", kind: 1, detail: "(code: string) → function?", documentation: "Compiles a string into a function (executor only).", insertText: "loadstring(${1})" },
  { label: "string.format", kind: 1, detail: "(fmt: string, ...any) → string", documentation: "Formats a string.", insertText: 'string.format("${1}", ${2})' },
  { label: "string.find", kind: 1, detail: "(s: string, pattern: string) → number?, number?", documentation: "Finds pattern in string.", insertText: 'string.find(${1}, "${2}")' },
  { label: "string.sub", kind: 1, detail: "(s: string, i: number, j?: number) → string", documentation: "Extracts substring.", insertText: "string.sub(${1}, ${2}, ${3})" },
  { label: "string.len", kind: 1, detail: "(s: string) → number", documentation: "Returns string length.", insertText: "string.len(${1})" },
  { label: "string.match", kind: 1, detail: "(s: string, pattern: string) → ...string?", documentation: "Pattern matching.", insertText: 'string.match(${1}, "${2}")' },
  { label: "string.gsub", kind: 1, detail: "(s: string, pattern: string, repl: string) → string", documentation: "Global substitution.", insertText: 'string.gsub(${1}, "${2}", "${3}")' },
  { label: "table.insert", kind: 1, detail: "(t: table, value: any) → void", documentation: "Inserts a value at the end of a table.", insertText: "table.insert(${1}, ${2})" },
  { label: "table.remove", kind: 1, detail: "(t: table, pos?: number) → any", documentation: "Removes a value from a table.", insertText: "table.remove(${1}, ${2})" },
  { label: "table.sort", kind: 1, detail: "(t: table, comp?: function) → void", documentation: "Sorts a table in-place.", insertText: "table.sort(${1})" },
  { label: "table.find", kind: 1, detail: "(t: table, value: any) → number?", documentation: "Finds value index in table.", insertText: "table.find(${1}, ${2})" },
  { label: "math.random", kind: 1, detail: "(m?: number, n?: number) → number", documentation: "Returns a random number.", insertText: "math.random(${1:1}, ${2:100})" },
  { label: "math.floor", kind: 1, detail: "(x: number) → number", documentation: "Rounds down.", insertText: "math.floor(${1})" },
  { label: "math.ceil", kind: 1, detail: "(x: number) → number", documentation: "Rounds up.", insertText: "math.ceil(${1})" },
  { label: "math.abs", kind: 1, detail: "(x: number) → number", documentation: "Absolute value.", insertText: "math.abs(${1})" },
  { label: "math.clamp", kind: 1, detail: "(x: number, min: number, max: number) → number", documentation: "Clamps value.", insertText: "math.clamp(${1}, ${2:0}, ${3:1})" },
];

// Roblox data types
export const ROBLOX_TYPES: APIEntry[] = [
  { label: "Vector3.new", kind: 1, detail: "(x?: number, y?: number, z?: number) → Vector3", documentation: "Creates a new Vector3.", insertText: "Vector3.new(${1:0}, ${2:0}, ${3:0})" },
  { label: "Vector2.new", kind: 1, detail: "(x?: number, y?: number) → Vector2", documentation: "Creates a new Vector2.", insertText: "Vector2.new(${1:0}, ${2:0})" },
  { label: "CFrame.new", kind: 1, detail: "(pos?: Vector3) → CFrame", documentation: "Creates a new CFrame.", insertText: "CFrame.new(${1:0}, ${2:0}, ${3:0})" },
  { label: "CFrame.lookAt", kind: 1, detail: "(from: Vector3, to: Vector3) → CFrame", documentation: "Creates a CFrame looking at a point.", insertText: "CFrame.lookAt(${1}, ${2})" },
  { label: "Color3.fromRGB", kind: 1, detail: "(r: number, g: number, b: number) → Color3", documentation: "Creates Color3 from RGB (0-255).", insertText: "Color3.fromRGB(${1:255}, ${2:255}, ${3:255})" },
  { label: "Color3.fromHSV", kind: 1, detail: "(h: number, s: number, v: number) → Color3", documentation: "Creates Color3 from HSV (0-1).", insertText: "Color3.fromHSV(${1:0}, ${2:1}, ${3:1})" },
  { label: "BrickColor.new", kind: 1, detail: "(name: string) → BrickColor", documentation: "Creates a BrickColor by name.", insertText: 'BrickColor.new("${1:Bright red}")' },
  { label: "UDim2.new", kind: 1, detail: "(xScale, xOffset, yScale, yOffset) → UDim2", documentation: "Creates a new UDim2 for UI positioning.", insertText: "UDim2.new(${1:0}, ${2:0}, ${3:0}, ${4:0})" },
  { label: "UDim2.fromScale", kind: 1, detail: "(xScale, yScale) → UDim2", documentation: "Creates UDim2 from scale values.", insertText: "UDim2.fromScale(${1:1}, ${2:1})" },
  { label: "UDim2.fromOffset", kind: 1, detail: "(xOffset, yOffset) → UDim2", documentation: "Creates UDim2 from pixel offsets.", insertText: "UDim2.fromOffset(${1:100}, ${2:100})" },
  { label: "TweenInfo.new", kind: 1, detail: "(time, style?, direction?, repeat?, reverses?, delay?) → TweenInfo", documentation: "Creates tween animation info.", insertText: "TweenInfo.new(${1:1}, Enum.EasingStyle.${2:Quad}, Enum.EasingDirection.${3:Out})" },
  { label: "Ray.new", kind: 1, detail: "(origin: Vector3, direction: Vector3) → Ray", documentation: "Creates a ray.", insertText: "Ray.new(${1}, ${2})" },
  { label: "Region3.new", kind: 1, detail: "(min: Vector3, max: Vector3) → Region3", documentation: "Creates a 3D region.", insertText: "Region3.new(${1}, ${2})" },
  { label: "Enum", kind: 5, detail: "Enums", documentation: "Access Roblox enumerations.", insertText: "Enum" },
  { label: "Enum.KeyCode", kind: 5, detail: "KeyCode Enum", documentation: "Keyboard and gamepad key codes.", insertText: "Enum.KeyCode.${1}" },
  { label: "Enum.Material", kind: 5, detail: "Material Enum", documentation: "Part material types.", insertText: "Enum.Material.${1:Plastic}" },
  { label: "Enum.EasingStyle", kind: 5, detail: "EasingStyle Enum", documentation: "Tween easing styles.", insertText: "Enum.EasingStyle.${1:Quad}" },
];

// Lua code snippets
export const LUA_SNIPPETS = [
  { label: "for-loop", prefix: "for", body: "for ${1:i} = ${2:1}, ${3:10} do\n\t${4}\nend", description: "Numeric for loop" },
  { label: "for-in-pairs", prefix: "forp", body: "for ${1:key}, ${2:value} in pairs(${3:table}) do\n\t${4}\nend", description: "For loop with pairs()" },
  { label: "for-in-ipairs", prefix: "fori", body: "for ${1:index}, ${2:value} in ipairs(${3:table}) do\n\t${4}\nend", description: "For loop with ipairs()" },
  { label: "function", prefix: "func", body: "function ${1:name}(${2})\n\t${3}\nend", description: "Function declaration" },
  { label: "local-function", prefix: "lfunc", body: "local function ${1:name}(${2})\n\t${3}\nend", description: "Local function" },
  { label: "if-then", prefix: "if", body: "if ${1:condition} then\n\t${2}\nend", description: "If statement" },
  { label: "if-then-else", prefix: "ife", body: "if ${1:condition} then\n\t${2}\nelse\n\t${3}\nend", description: "If-else statement" },
  { label: "while-loop", prefix: "while", body: "while ${1:condition} do\n\t${2}\nend", description: "While loop" },
  { label: "repeat-until", prefix: "repeat", body: "repeat\n\t${1}\nuntil ${2:condition}", description: "Repeat-until loop" },
  { label: "pcall-wrap", prefix: "pcall", body: "local ${1:success}, ${2:result} = pcall(function()\n\t${3}\nend)\n\nif not ${1:success} then\n\twarn(${2:result})\nend", description: "Protected call pattern" },
  { label: "module-script", prefix: "module", body: "local ${1:Module} = {}\n\nfunction ${1:Module}.${2:init}(${3})\n\t${4}\nend\n\nreturn ${1:Module}", description: "Module script template" },
  { label: "roblox-service", prefix: "service", body: 'local ${1:Players} = game:GetService("${1:Players}")', description: "Get Roblox service" },
  { label: "connect-event", prefix: "connect", body: "${1:instance}.${2:Event}:Connect(function(${3})\n\t${4}\nend)", description: "Connect to an event" },
  { label: "tween-create", prefix: "tween", body: 'local TweenService = game:GetService("TweenService")\nlocal tweenInfo = TweenInfo.new(${1:1}, Enum.EasingStyle.${2:Quad}, Enum.EasingDirection.${3:Out})\nlocal tween = TweenService:Create(${4:instance}, tweenInfo, {\n\t${5:Property} = ${6:value}\n})\ntween:Play()', description: "Create and play a tween" },
  { label: "remote-event", prefix: "remote", body: 'local ${1:RemoteEvent} = Instance.new("RemoteEvent")\n${1:RemoteEvent}.Parent = game:GetService("ReplicatedStorage")\n${1:RemoteEvent}.Name = "${2:EventName}"', description: "Create a RemoteEvent" },
  { label: "player-added", prefix: "playeradded", body: 'local Players = game:GetService("Players")\n\nPlayers.PlayerAdded:Connect(function(player)\n\t${1}\nend)', description: "Player added handler" },
  { label: "loadstring-exec", prefix: "loadstr", body: 'loadstring(game:HttpGet("${1:url}"))()', description: "Loadstring executor pattern" },
  { label: "wait-for-character", prefix: "waitchar", body: "local player = game:GetService(\"Players\").LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\nlocal humanoid = character:WaitForChild(\"Humanoid\")", description: "Wait for player character" },
];

// Basic Lua error patterns for linting
export interface LintError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
}

export function lintLuaCode(code: string): LintError[] {
  const errors: LintError[] = [];
  const lines = code.split("\n");
  
  const blockStack: { type: string; line: number }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;
    
    // Skip comments
    if (trimmed.startsWith("--")) continue;
    
    // Remove string literals for analysis
    const noStrings = trimmed.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''").replace(/\[\[.*?\]\]/g, '""');
    
    // Check unfinished assignment
    if (/^local\s+\w+\s*=\s*$/.test(noStrings)) {
      errors.push({ line: lineNum, column: 1, message: "تعيين غير مكتمل - القيمة مفقودة", severity: "error" });
    }
    
    // Check block openers
    if (/\b(function|if|for|while|repeat)\b/.test(noStrings) && !trimmed.startsWith("--")) {
      if (/\bfunction\b/.test(noStrings)) {
        blockStack.push({ type: "function", line: lineNum });
      }
      if (/\bif\b.*\bthen\b/.test(noStrings)) {
        blockStack.push({ type: "if", line: lineNum });
      }
      if (/\b(for|while)\b.*\bdo\b/.test(noStrings)) {
        blockStack.push({ type: "loop", line: lineNum });
      }
      if (/\brepeat\b/.test(noStrings)) {
        blockStack.push({ type: "repeat", line: lineNum });
      }
    }
    
    // Check block closers
    if (/^\s*end\s*$/.test(line) || /\bend\s*[;)]*\s*$/.test(noStrings)) {
      if (blockStack.length > 0 && blockStack[blockStack.length - 1].type !== "repeat") {
        blockStack.pop();
      }
    }
    if (/\buntil\b/.test(noStrings)) {
      if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === "repeat") {
        blockStack.pop();
      }
    }
    
    // Deprecated function warnings
    if (/\bwait\s*\(/.test(noStrings)) {
      errors.push({ line: lineNum, column: noStrings.indexOf("wait") + 1, message: "⚠️ wait() مهمل - استخدم task.wait() بدلاً منه", severity: "warning" });
    }
    if (/\bspawn\s*\(/.test(noStrings) && !/task\.spawn/.test(noStrings)) {
      errors.push({ line: lineNum, column: noStrings.indexOf("spawn") + 1, message: "⚠️ spawn() مهمل - استخدم task.spawn() بدلاً منه", severity: "warning" });
    }
    if (/\bdelay\s*\(/.test(noStrings) && !/task\.delay/.test(noStrings)) {
      errors.push({ line: lineNum, column: noStrings.indexOf("delay") + 1, message: "⚠️ delay() مهمل - استخدم task.delay() بدلاً منه", severity: "warning" });
    }
    
    // Unused variable detection (simple)
    const localMatch = trimmed.match(/^local\s+(\w+)\s*=/);
    if (localMatch) {
      const varName = localMatch[1];
      const restOfCode = lines.slice(i + 1).join("\n");
      const usageRegex = new RegExp(`\\b${varName}\\b`);
      if (!usageRegex.test(restOfCode) && varName !== "_") {
        errors.push({ line: lineNum, column: 7, message: `متغير "${varName}" معرف ولكن غير مستخدم`, severity: "info" });
      }
    }
    
    // Potential nil access
    if (/\.\w+\.\w+\.\w+\.\w+/.test(noStrings)) {
      errors.push({ line: lineNum, column: 1, message: "💡 سلسلة وصول طويلة - قد تسبب خطأ nil", severity: "info" });
    }
    
    // Infinite loop detection
    if (/while\s+true\s+do/.test(noStrings)) {
      const hasWait = lines.slice(i, Math.min(i + 15, lines.length)).some(l => 
        /\b(wait|task\.wait|task\.delay)\b/.test(l)
      );
      if (!hasWait) {
        errors.push({ line: lineNum, column: 1, message: "⚠️ حلقة لانهائية بدون wait - قد تسبب تجمد", severity: "warning" });
      }
    }
  }
  
  return errors;
}
