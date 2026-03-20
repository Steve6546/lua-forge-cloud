import type { Monaco } from "@monaco-editor/react";

type SymbolKind = "function" | "property" | "class" | "module" | "variable" | "keyword" | "event";

type RobloxSymbol = {
  label: string;
  kind: SymbolKind;
  insertText: string;
  detail: string;
  documentation: string;
  aliases?: string[];
  asSnippet?: boolean;
};

const LUA_KEYWORDS = [
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function", "if",
  "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while",
];

const ROBLOX_SYMBOLS: RobloxSymbol[] = [
  // ── Core Globals ────────────────────────────────────────────────────────────
  {
    label: "game",
    kind: "variable",
    insertText: "game",
    detail: "DataModel",
    documentation: "The top-level DataModel for the current Roblox experience. It provides access to all services.",
    aliases: ["DataModel"],
  },
  {
    label: "workspace",
    kind: "variable",
    insertText: "workspace",
    detail: "Workspace",
    documentation: "Contains 3D objects rendered in the world. It is the root of the physical world.",
  },
  {
    label: "script",
    kind: "variable",
    insertText: "script",
    detail: "LuaSourceContainer",
    documentation: "A reference to the current Lua script executing this code.",
  },
  {
    label: "shared",
    kind: "variable",
    insertText: "shared",
    detail: "table",
    documentation: "A table shared between all scripts of the same context (Client or Server).",
  },
  {
    label: "_G",
    kind: "variable",
    insertText: "_G",
    detail: "table",
    documentation: "A global table shared between all scripts of the same context (Client or Server).",
  },

  // ── Classes ─────────────────────────────────────────────────────────────────
  {
    label: "Instance",
    kind: "class",
    insertText: "Instance",
    detail: "class",
    documentation: "Base class for almost all Roblox objects. Used for creating new objects via `Instance.new`.",
  },
  {
    label: "Instance.new",
    kind: "function",
    insertText: 'Instance.new("${1:Part}")',
    detail: "Instance.new(className: string, parent?: Instance): Instance",
    documentation: "Creates a new Instance of the given Roblox class.",
    aliases: ["new"],
    asSnippet: true,
  },
  {
    label: "Vector3",
    kind: "class",
    insertText: "Vector3",
    detail: "class",
    documentation: "A 3D vector used for positions and directions.",
  },
  {
    label: "Vector3.new",
    kind: "function",
    insertText: "Vector3.new(${1:0}, ${2:0}, ${3:0})",
    detail: "Vector3.new(x: number, y: number, z: number): Vector3",
    documentation: "Creates a new Vector3 with the given coordinates.",
    asSnippet: true,
  },
  {
    label: "Vector2",
    kind: "class",
    insertText: "Vector2",
    detail: "class",
    documentation: "A 2D vector used for screen positions and UI layouts.",
  },
  {
    label: "Vector2.new",
    kind: "function",
    insertText: "Vector2.new(${1:0}, ${2:0})",
    detail: "Vector2.new(x: number, y: number): Vector2",
    documentation: "Creates a new Vector2 with the given coordinates.",
    asSnippet: true,
  },
  {
    label: "Color3",
    kind: "class",
    insertText: "Color3",
    detail: "class",
    documentation: "Represents a color using RGB values.",
  },
  {
    label: "Color3.fromRGB",
    kind: "function",
    insertText: "Color3.fromRGB(${1:255}, ${2:255}, ${3:255})",
    detail: "Color3.fromRGB(r: number, g: number, b: number): Color3",
    documentation: "Creates a new Color3 from 0-255 RGB values.",
    asSnippet: true,
  },
  {
    label: "Color3.fromHSV",
    kind: "function",
    insertText: "Color3.fromHSV(${1:0}, ${2:1}, ${3:1})",
    detail: "Color3.fromHSV(h: number, s: number, v: number): Color3",
    documentation: "Creates a Color3 from hue, saturation, value (0–1 range).",
    asSnippet: true,
  },
  {
    label: "CFrame",
    kind: "class",
    insertText: "CFrame",
    detail: "class",
    documentation: "Coordinate Frame: represents a position and rotation in 3D space.",
  },
  {
    label: "CFrame.new",
    kind: "function",
    insertText: "CFrame.new(${1:0}, ${2:0}, ${3:0})",
    detail: "CFrame.new(pos: Vector3): CFrame",
    documentation: "Creates a new CFrame with the given position.",
    asSnippet: true,
  },
  {
    label: "UDim2",
    kind: "class",
    insertText: "UDim2",
    detail: "class",
    documentation: "Used for UI sizing and positioning — combines scale and offset.",
  },
  {
    label: "UDim2.new",
    kind: "function",
    insertText: "UDim2.new(${1:0}, ${2:0}, ${3:0}, ${4:0})",
    detail: "UDim2.new(xScale, xOffset, yScale, yOffset): UDim2",
    documentation: "Creates a new UDim2 for UI positioning.",
    asSnippet: true,
  },
  {
    label: "UDim2.fromScale",
    kind: "function",
    insertText: "UDim2.fromScale(${1:0.5}, ${2:0.5})",
    detail: "UDim2.fromScale(x: number, y: number): UDim2",
    documentation: "Creates a UDim2 using scale values only.",
    asSnippet: true,
  },
  {
    label: "UDim2.fromOffset",
    kind: "function",
    insertText: "UDim2.fromOffset(${1:100}, ${2:50})",
    detail: "UDim2.fromOffset(x: number, y: number): UDim2",
    documentation: "Creates a UDim2 using pixel offset values only.",
    asSnippet: true,
  },
  {
    label: "TweenInfo",
    kind: "class",
    insertText: "TweenInfo",
    detail: "class",
    documentation: "Stores animation parameters for TweenService.",
  },
  {
    label: "TweenInfo.new",
    kind: "function",
    insertText: "TweenInfo.new(${1:1}, Enum.EasingStyle.${2:Quad}, Enum.EasingDirection.${3:Out})",
    detail: "TweenInfo.new(time, easingStyle, easingDirection, repeatCount?, reverses?, delayTime?)",
    documentation: "Creates a TweenInfo for use with TweenService:Create.",
    asSnippet: true,
  },
  {
    label: "BrickColor",
    kind: "class",
    insertText: "BrickColor",
    detail: "class",
    documentation: "Represents a Roblox brick color.",
  },
  {
    label: "BrickColor.new",
    kind: "function",
    insertText: 'BrickColor.new("${1:Bright red}")',
    detail: "BrickColor.new(name: string): BrickColor",
    documentation: "Creates a BrickColor by name.",
    asSnippet: true,
  },
  {
    label: "Ray",
    kind: "class",
    insertText: "Ray",
    detail: "class",
    documentation: "A ray defined by an origin and direction.",
  },
  {
    label: "Ray.new",
    kind: "function",
    insertText: "Ray.new(${1:origin}, ${2:direction})",
    detail: "Ray.new(origin: Vector3, direction: Vector3): Ray",
    documentation: "Creates a new Ray.",
    asSnippet: true,
  },

  // ── Services ─────────────────────────────────────────────────────────────────
  {
    label: "game:GetService",
    kind: "function",
    insertText: 'game:GetService("${1:Players}")',
    detail: "game:GetService(serviceName: string): Instance",
    documentation: "Returns a Roblox service singleton by name. Common: Players, ReplicatedStorage, TweenService, HttpService, RunService, UserInputService.",
    aliases: ["GetService"],
    asSnippet: true,
  },
  {
    label: "Players",
    kind: "module",
    insertText: 'game:GetService("Players")',
    detail: "Service",
    documentation: "Roblox service responsible for player management, player joining/leaving, and local player access.",
  },
  {
    label: "TweenService",
    kind: "module",
    insertText: 'game:GetService("TweenService")',
    detail: "Service",
    documentation: "Service for smoothly interpolating properties of Roblox objects.",
  },
  {
    label: "ReplicatedStorage",
    kind: "module",
    insertText: 'game:GetService("ReplicatedStorage")',
    detail: "Service",
    documentation: "A service for storing objects accessible from both client and server.",
  },
  {
    label: "HttpService",
    kind: "module",
    insertText: 'game:GetService("HttpService")',
    detail: "Service",
    documentation: "Service that allows making HTTP requests to external websites.",
  },
  {
    label: "RunService",
    kind: "module",
    insertText: 'game:GetService("RunService")',
    detail: "Service",
    documentation: "Provides events that fire every frame (Heartbeat, RenderStepped, Stepped) and runtime state queries.",
  },
  {
    label: "UserInputService",
    kind: "module",
    insertText: 'game:GetService("UserInputService")',
    detail: "Service",
    documentation: "Handles keyboard, mouse, touch, and gamepad input.",
  },
  {
    label: "ServerStorage",
    kind: "module",
    insertText: 'game:GetService("ServerStorage")',
    detail: "Service",
    documentation: "Storage for objects that should only exist on the server.",
  },
  {
    label: "Lighting",
    kind: "module",
    insertText: 'game:GetService("Lighting")',
    detail: "Service",
    documentation: "Controls the environmental lighting of the game world.",
  },
  {
    label: "SoundService",
    kind: "module",
    insertText: 'game:GetService("SoundService")',
    detail: "Service",
    documentation: "Controls game-wide audio settings and ambient sound.",
  },
  {
    label: "StarterGui",
    kind: "module",
    insertText: 'game:GetService("StarterGui")',
    detail: "Service",
    documentation: "Template GUI container cloned into each player's PlayerGui on join.",
  },
  {
    label: "StarterPack",
    kind: "module",
    insertText: 'game:GetService("StarterPack")',
    detail: "Service",
    documentation: "Contains tools given to players when they spawn.",
  },
  {
    label: "Workspace",
    kind: "module",
    insertText: 'game:GetService("Workspace")',
    detail: "Service",
    documentation: "The 3D world container. Equivalent to the global `workspace`.",
  },
  {
    label: "ContextActionService",
    kind: "module",
    insertText: 'game:GetService("ContextActionService")',
    detail: "Service",
    documentation: "Binds actions to inputs (keyboard, gamepad, touch) for context-sensitive controls.",
  },
  {
    label: "CollectionService",
    kind: "module",
    insertText: 'game:GetService("CollectionService")',
    detail: "Service",
    documentation: "Tags instances with string labels for group management.",
  },
  {
    label: "DataStoreService",
    kind: "module",
    insertText: 'game:GetService("DataStoreService")',
    detail: "Service",
    documentation: "Provides persistent key-value storage for player and game data.",
  },
  {
    label: "MarketplaceService",
    kind: "module",
    insertText: 'game:GetService("MarketplaceService")',
    detail: "Service",
    documentation: "Handles Robux purchases, gamepasses, and developer products.",
  },
  {
    label: "PhysicsService",
    kind: "module",
    insertText: 'game:GetService("PhysicsService")',
    detail: "Service",
    documentation: "Manages collision groups for physics filtering.",
  },
  {
    label: "PathfindingService",
    kind: "module",
    insertText: 'game:GetService("PathfindingService")',
    detail: "Service",
    documentation: "Computes navigation paths for NPC movement.",
  },
  {
    label: "TextService",
    kind: "module",
    insertText: 'game:GetService("TextService")',
    detail: "Service",
    documentation: "Filters user-generated text for chat safety.",
  },
  {
    label: "Teams",
    kind: "module",
    insertText: 'game:GetService("Teams")',
    detail: "Service",
    documentation: "Manages team assignments for players.",
  },
  {
    label: "Chat",
    kind: "module",
    insertText: 'game:GetService("Chat")',
    detail: "Service",
    documentation: "Handles in-game chat messages.",
  },

  // ── Enums ────────────────────────────────────────────────────────────────────
  {
    label: "Enum",
    kind: "module",
    insertText: "Enum",
    detail: "Enum namespace",
    documentation: "Root namespace for all Roblox Enum types (e.g. Enum.KeyCode, Enum.EasingStyle).",
  },
  {
    label: "Enum.KeyCode",
    kind: "property",
    insertText: "Enum.KeyCode.${1:W}",
    detail: "Enum.KeyCode",
    documentation: "Keyboard key codes used with UserInputService and ContextActionService.",
    asSnippet: true,
  },
  {
    label: "Enum.EasingStyle",
    kind: "property",
    insertText: "Enum.EasingStyle.${1:Quad}",
    detail: "Enum.EasingStyle",
    documentation: "Easing style for TweenInfo (Linear, Quad, Cubic, Quart, Quint, Bounce, Elastic, Exponential, Sine, Back, Circular).",
    asSnippet: true,
  },
  {
    label: "Enum.EasingDirection",
    kind: "property",
    insertText: "Enum.EasingDirection.${1:Out}",
    detail: "Enum.EasingDirection",
    documentation: "Direction of easing: In, Out, or InOut.",
    asSnippet: true,
  },
  {
    label: "Enum.UserInputType",
    kind: "property",
    insertText: "Enum.UserInputType.${1:MouseButton1}",
    detail: "Enum.UserInputType",
    documentation: "Input device types: MouseButton1, MouseButton2, Touch, Gamepad1, Keyboard, etc.",
    asSnippet: true,
  },
  {
    label: "Enum.Material",
    kind: "property",
    insertText: "Enum.Material.${1:SmoothPlastic}",
    detail: "Enum.Material",
    documentation: "Part material types: SmoothPlastic, Wood, Metal, Neon, Glass, etc.",
    asSnippet: true,
  },
  {
    label: "Enum.RaycastFilterType",
    kind: "property",
    insertText: "Enum.RaycastFilterType.${1:Exclude}",
    detail: "Enum.RaycastFilterType",
    documentation: "Exclude or Include specific instances in raycasting.",
    asSnippet: true,
  },

  // ── Players properties & events ──────────────────────────────────────────────
  {
    label: "Players.LocalPlayer",
    kind: "property",
    insertText: "Players.LocalPlayer",
    detail: "Player (LocalScript only)",
    documentation: "The player running the current LocalScript. Nil on the server.",
    aliases: ["LocalPlayer"],
  },
  {
    label: "Players.PlayerAdded",
    kind: "event",
    insertText: "Players.PlayerAdded:Connect(function(${1:player})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires when a player joins the game.",
    aliases: ["PlayerAdded"],
    asSnippet: true,
  },
  {
    label: "Players.PlayerRemoving",
    kind: "event",
    insertText: "Players.PlayerRemoving:Connect(function(${1:player})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires when a player leaves the game.",
    aliases: ["PlayerRemoving"],
    asSnippet: true,
  },

  // ── RunService events ────────────────────────────────────────────────────────
  {
    label: "RunService.Heartbeat",
    kind: "event",
    insertText: "RunService.Heartbeat:Connect(function(${1:deltaTime})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires every physics frame with the elapsed time since the last frame.",
    asSnippet: true,
  },
  {
    label: "RunService.RenderStepped",
    kind: "event",
    insertText: "RunService.RenderStepped:Connect(function(${1:deltaTime})\n\t${0}\nend)",
    detail: "RBXScriptSignal (LocalScript only)",
    documentation: "Fires before each frame is rendered on the client.",
    asSnippet: true,
  },
  {
    label: "RunService.Stepped",
    kind: "event",
    insertText: "RunService.Stepped:Connect(function(${1:time}, ${2:deltaTime})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires every physics step, before physics simulation.",
    asSnippet: true,
  },
  {
    label: "RunService:IsServer",
    kind: "function",
    insertText: "RunService:IsServer()",
    detail: "RunService:IsServer(): boolean",
    documentation: "Returns true when the script is running on the server.",
  },
  {
    label: "RunService:IsClient",
    kind: "function",
    insertText: "RunService:IsClient()",
    detail: "RunService:IsClient(): boolean",
    documentation: "Returns true when the script is running on the client.",
  },

  // ── TweenService ─────────────────────────────────────────────────────────────
  {
    label: "TweenService:Create",
    kind: "function",
    insertText: "TweenService:Create(${1:instance}, TweenInfo.new(${2:1}), {${3:property} = ${4:value}})",
    detail: "TweenService:Create(instance, tweenInfo, propertyTable): Tween",
    documentation: "Creates a Tween object that animates the given properties of an instance.",
    aliases: ["Create"],
    asSnippet: true,
  },

  // ── HttpService ──────────────────────────────────────────────────────────────
  {
    label: "HttpService:GetAsync",
    kind: "function",
    insertText: 'HttpService:GetAsync("${1:https://example.com}")',
    detail: "HttpService:GetAsync(url: string, nocache?: boolean): string",
    documentation: "Performs an HTTP GET request and returns the response body as a string.",
    asSnippet: true,
  },
  {
    label: "HttpService:PostAsync",
    kind: "function",
    insertText: 'HttpService:PostAsync("${1:url}", "${2:data}")',
    detail: "HttpService:PostAsync(url, data, contentType?, compress?, headers?): string",
    documentation: "Performs an HTTP POST request.",
    asSnippet: true,
  },
  {
    label: "HttpService:JSONEncode",
    kind: "function",
    insertText: "HttpService:JSONEncode(${1:table})",
    detail: "HttpService:JSONEncode(value: any): string",
    documentation: "Serializes a Lua table to a JSON string.",
    asSnippet: true,
  },
  {
    label: "HttpService:JSONDecode",
    kind: "function",
    insertText: 'HttpService:JSONDecode("${1:jsonString}")',
    detail: "HttpService:JSONDecode(json: string): any",
    documentation: "Deserializes a JSON string into a Lua table.",
    asSnippet: true,
  },

  // ── DataStoreService ─────────────────────────────────────────────────────────
  {
    label: "DataStoreService:GetDataStore",
    kind: "function",
    insertText: 'DataStoreService:GetDataStore("${1:PlayerData}")',
    detail: "DataStoreService:GetDataStore(name: string, scope?: string): DataStore",
    documentation: "Returns a DataStore object for persistent data storage.",
    asSnippet: true,
  },

  // ── Instance methods ──────────────────────────────────────────────────────────
  {
    label: "Instance:Destroy",
    kind: "function",
    insertText: "Destroy()",
    detail: "Instance:Destroy(): void",
    documentation: "Removes the instance from the world and locks its parent.",
    aliases: ["Destroy"],
  },
  {
    label: "Instance:Clone",
    kind: "function",
    insertText: "Clone()",
    detail: "Instance:Clone(): Instance",
    documentation: "Creates a copy of the instance and all its descendants.",
    aliases: ["Clone"],
  },
  {
    label: "Instance:FindFirstChild",
    kind: "function",
    insertText: 'FindFirstChild("${1:Name}")',
    detail: "Instance:FindFirstChild(name: string, recursive?: boolean): Instance?",
    documentation: "Searches for a child by name. Returns nil if not found.",
    aliases: ["FindFirstChild"],
    asSnippet: true,
  },
  {
    label: "Instance:WaitForChild",
    kind: "function",
    insertText: 'WaitForChild("${1:Name}")',
    detail: "Instance:WaitForChild(name: string, timeLimit?: number): Instance?",
    documentation: "Yields until a child with the given name exists.",
    aliases: ["WaitForChild"],
    asSnippet: true,
  },
  {
    label: "Instance:FindFirstChildOfClass",
    kind: "function",
    insertText: 'FindFirstChildOfClass("${1:Part}")',
    detail: "Instance:FindFirstChildOfClass(className: string): Instance?",
    documentation: "Finds the first direct child whose class matches the given name.",
    aliases: ["FindFirstChildOfClass"],
    asSnippet: true,
  },
  {
    label: "Instance:IsA",
    kind: "function",
    insertText: 'IsA("${1:BasePart}")',
    detail: "Instance:IsA(className: string): boolean",
    documentation: "Returns true if the instance is of the given class or a subclass.",
    aliases: ["IsA"],
    asSnippet: true,
  },
  {
    label: "Instance:GetChildren",
    kind: "function",
    insertText: "GetChildren()",
    detail: "Instance:GetChildren(): {Instance}",
    documentation: "Returns an array of all direct children of this instance.",
    aliases: ["GetChildren"],
  },
  {
    label: "Instance:GetDescendants",
    kind: "function",
    insertText: "GetDescendants()",
    detail: "Instance:GetDescendants(): {Instance}",
    documentation: "Returns an array of all descendants (recursive children).",
    aliases: ["GetDescendants"],
  },
  {
    label: "Instance:SetAttribute",
    kind: "function",
    insertText: 'SetAttribute("${1:attributeName}", ${2:value})',
    detail: "Instance:SetAttribute(attribute: string, value: any): void",
    documentation: "Sets a custom attribute on the instance.",
    aliases: ["SetAttribute"],
    asSnippet: true,
  },
  {
    label: "Instance:GetAttribute",
    kind: "function",
    insertText: 'GetAttribute("${1:attributeName}")',
    detail: "Instance:GetAttribute(attribute: string): any",
    documentation: "Returns the value of a custom attribute.",
    aliases: ["GetAttribute"],
    asSnippet: true,
  },

  // ── Task & Globals ────────────────────────────────────────────────────────────
  {
    label: "task.wait",
    kind: "function",
    insertText: "task.wait(${1:1})",
    detail: "task.wait(seconds?: number): number",
    documentation: "Yields the current thread for the specified duration. Preferred over `wait()`.",
    asSnippet: true,
  },
  {
    label: "task.spawn",
    kind: "function",
    insertText: "task.spawn(function()\n\t${0}\nend)",
    detail: "task.spawn(callback: function, ...args): thread",
    documentation: "Spawns a function in a new thread immediately.",
    asSnippet: true,
  },
  {
    label: "task.delay",
    kind: "function",
    insertText: "task.delay(${1:1}, function()\n\t${0}\nend)",
    detail: "task.delay(delayTime: number, callback: function): thread",
    documentation: "Calls a function after a delay without yielding the current thread.",
    asSnippet: true,
  },
  {
    label: "task.defer",
    kind: "function",
    insertText: "task.defer(function()\n\t${0}\nend)",
    detail: "task.defer(callback: function): thread",
    documentation: "Defers a function to run after the current task completes.",
    asSnippet: true,
  },
  {
    label: "task.cancel",
    kind: "function",
    insertText: "task.cancel(${1:thread})",
    detail: "task.cancel(thread: thread): void",
    documentation: "Cancels a scheduled task created by task.delay or task.defer.",
    asSnippet: true,
  },
  {
    label: "wait",
    kind: "function",
    insertText: "wait(${1:1})",
    detail: "wait(seconds?: number): (number, number)",
    documentation: "Yields the current thread. Use task.wait() for better accuracy.",
    asSnippet: true,
  },
  {
    label: "print",
    kind: "function",
    insertText: 'print("${1:message}")',
    detail: "print(...args): void",
    documentation: "Writes values to the output console.",
    asSnippet: true,
  },
  {
    label: "warn",
    kind: "function",
    insertText: 'warn("${1:warning}")',
    detail: "warn(...args): void",
    documentation: "Writes a warning message to the output console.",
    asSnippet: true,
  },
  {
    label: "error",
    kind: "function",
    insertText: 'error("${1:error message}")',
    detail: "error(message: string, level?: number): void",
    documentation: "Throws an error with the specified message.",
    asSnippet: true,
  },
  {
    label: "tostring",
    kind: "function",
    insertText: "tostring(${1:value})",
    detail: "tostring(value: any): string",
    documentation: "Converts a value to its string representation.",
    asSnippet: true,
  },
  {
    label: "tonumber",
    kind: "function",
    insertText: "tonumber(${1:value})",
    detail: "tonumber(value: any, base?: number): number?",
    documentation: "Converts a value to a number, or nil if conversion fails.",
    asSnippet: true,
  },
  {
    label: "type",
    kind: "function",
    insertText: "type(${1:value})",
    detail: "type(value: any): string",
    documentation: "Returns the type of a value as a string (nil, boolean, number, string, table, function, thread, userdata).",
    asSnippet: true,
  },
  {
    label: "typeof",
    kind: "function",
    insertText: "typeof(${1:value})",
    detail: "typeof(value: any): string",
    documentation: "Roblox extension of type() — returns Roblox-specific types such as Vector3, CFrame, Instance, etc.",
    asSnippet: true,
  },
  {
    label: "pairs",
    kind: "function",
    insertText: "pairs(${1:table})",
    detail: "pairs(t: table): iterator",
    documentation: "Returns an iterator for all key-value pairs in a table.",
    asSnippet: true,
  },
  {
    label: "ipairs",
    kind: "function",
    insertText: "ipairs(${1:table})",
    detail: "ipairs(t: table): iterator",
    documentation: "Returns an iterator for array-style (integer-indexed) table entries.",
    asSnippet: true,
  },
  {
    label: "unpack",
    kind: "function",
    insertText: "unpack(${1:table})",
    detail: "unpack(list: table, i?: number, j?: number): ...any",
    documentation: "Returns the elements of a table as multiple return values.",
    asSnippet: true,
  },
  {
    label: "select",
    kind: "function",
    insertText: "select(${1:'#'}, ${2:...})",
    detail: "select(index: string|number, ...): any",
    documentation: "Returns elements from varargs starting at index, or '#' to count them.",
    asSnippet: true,
  },
  {
    label: "rawget",
    kind: "function",
    insertText: "rawget(${1:table}, ${2:key})",
    detail: "rawget(table, key): any",
    documentation: "Gets a table value without invoking __index metamethod.",
    asSnippet: true,
  },
  {
    label: "rawset",
    kind: "function",
    insertText: "rawset(${1:table}, ${2:key}, ${3:value})",
    detail: "rawset(table, key, value): table",
    documentation: "Sets a table value without invoking __newindex metamethod.",
    asSnippet: true,
  },
  {
    label: "setmetatable",
    kind: "function",
    insertText: "setmetatable(${1:table}, ${2:metatable})",
    detail: "setmetatable(table, metatable): table",
    documentation: "Sets the metatable for a table, enabling OOP patterns.",
    asSnippet: true,
  },
  {
    label: "getmetatable",
    kind: "function",
    insertText: "getmetatable(${1:object})",
    detail: "getmetatable(object: table): table?",
    documentation: "Returns the metatable of a table or userdata.",
    asSnippet: true,
  },
  {
    label: "pcall",
    kind: "function",
    insertText: "pcall(function()\n\t${0}\nend)",
    detail: "pcall(f: function, ...args): (boolean, any)",
    documentation: "Calls a function in protected mode. Returns success bool + result or error.",
    asSnippet: true,
  },
  {
    label: "xpcall",
    kind: "function",
    insertText: "xpcall(function()\n\t${0}\nend, function(err)\n\twarn(err)\nend)",
    detail: "xpcall(f: function, msgh: function, ...args): (boolean, any)",
    documentation: "Like pcall but calls a message handler on error.",
    asSnippet: true,
  },
  {
    label: "coroutine.create",
    kind: "function",
    insertText: "coroutine.create(function()\n\t${0}\nend)",
    detail: "coroutine.create(f: function): thread",
    documentation: "Creates a new coroutine thread.",
    asSnippet: true,
  },
  {
    label: "coroutine.wrap",
    kind: "function",
    insertText: "coroutine.wrap(function()\n\t${0}\nend)",
    detail: "coroutine.wrap(f: function): function",
    documentation: "Returns a function that resumes the coroutine on each call.",
    asSnippet: true,
  },
  {
    label: "coroutine.resume",
    kind: "function",
    insertText: "coroutine.resume(${1:thread})",
    detail: "coroutine.resume(co: thread, ...args): (boolean, any)",
    documentation: "Resumes a coroutine, returning success status.",
    asSnippet: true,
  },
  {
    label: "coroutine.yield",
    kind: "function",
    insertText: "coroutine.yield(${1:value})",
    detail: "coroutine.yield(...args): ...any",
    documentation: "Suspends the current coroutine, passing values to the resumer.",
    asSnippet: true,
  },
  {
    label: "string.format",
    kind: "function",
    insertText: 'string.format("${1:%s}", ${2:value})',
    detail: "string.format(fmt: string, ...): string",
    documentation: "Formats a string using printf-style format specifiers.",
    asSnippet: true,
  },
  {
    label: "string.len",
    kind: "function",
    insertText: "string.len(${1:str})",
    detail: "string.len(s: string): number",
    documentation: "Returns the length of a string.",
    asSnippet: true,
  },
  {
    label: "string.sub",
    kind: "function",
    insertText: "string.sub(${1:str}, ${2:1}, ${3:-1})",
    detail: "string.sub(s: string, i: number, j?: number): string",
    documentation: "Returns a substring from index i to j.",
    asSnippet: true,
  },
  {
    label: "string.find",
    kind: "function",
    insertText: 'string.find(${1:str}, "${2:pattern}")',
    detail: "string.find(s, pattern, init?, plain?): number?, number?",
    documentation: "Finds the first occurrence of a pattern in a string.",
    asSnippet: true,
  },
  {
    label: "string.gsub",
    kind: "function",
    insertText: 'string.gsub(${1:str}, "${2:pattern}", "${3:replacement}")',
    detail: "string.gsub(s, pattern, repl, n?): string, number",
    documentation: "Replaces occurrences of a pattern in a string.",
    asSnippet: true,
  },
  {
    label: "string.split",
    kind: "function",
    insertText: 'string.split(${1:str}, "${2:separator}")',
    detail: "string.split(s: string, sep: string): {string}",
    documentation: "Splits a string by a separator and returns a table of parts.",
    asSnippet: true,
  },
  {
    label: "table.insert",
    kind: "function",
    insertText: "table.insert(${1:tbl}, ${2:value})",
    detail: "table.insert(t: table, value: any): void",
    documentation: "Appends a value to the end of a table, or inserts at a position.",
    asSnippet: true,
  },
  {
    label: "table.remove",
    kind: "function",
    insertText: "table.remove(${1:tbl}, ${2:index})",
    detail: "table.remove(t: table, pos?: number): any",
    documentation: "Removes and returns an element from a table.",
    asSnippet: true,
  },
  {
    label: "table.concat",
    kind: "function",
    insertText: 'table.concat(${1:tbl}, "${2:separator}")',
    detail: "table.concat(t: table, sep?: string, i?: number, j?: number): string",
    documentation: "Concatenates table string elements into a single string.",
    asSnippet: true,
  },
  {
    label: "table.sort",
    kind: "function",
    insertText: "table.sort(${1:tbl})",
    detail: "table.sort(t: table, comp?: function): void",
    documentation: "Sorts a table in-place. Optional comparator function.",
    asSnippet: true,
  },
  {
    label: "table.find",
    kind: "function",
    insertText: "table.find(${1:tbl}, ${2:value})",
    detail: "table.find(t: table, value: any, init?: number): number?",
    documentation: "Finds the index of a value in an array-style table.",
    asSnippet: true,
  },
  {
    label: "math.random",
    kind: "function",
    insertText: "math.random(${1:1}, ${2:100})",
    detail: "math.random(m?: number, n?: number): number",
    documentation: "Returns a random number. With two args returns an integer in [m, n].",
    asSnippet: true,
  },
  {
    label: "math.floor",
    kind: "function",
    insertText: "math.floor(${1:value})",
    detail: "math.floor(x: number): number",
    documentation: "Returns the largest integer ≤ x.",
    asSnippet: true,
  },
  {
    label: "math.ceil",
    kind: "function",
    insertText: "math.ceil(${1:value})",
    detail: "math.ceil(x: number): number",
    documentation: "Returns the smallest integer ≥ x.",
    asSnippet: true,
  },
  {
    label: "math.abs",
    kind: "function",
    insertText: "math.abs(${1:value})",
    detail: "math.abs(x: number): number",
    documentation: "Returns the absolute value of x.",
    asSnippet: true,
  },
  {
    label: "math.max",
    kind: "function",
    insertText: "math.max(${1:a}, ${2:b})",
    detail: "math.max(...numbers): number",
    documentation: "Returns the maximum value among its arguments.",
    asSnippet: true,
  },
  {
    label: "math.min",
    kind: "function",
    insertText: "math.min(${1:a}, ${2:b})",
    detail: "math.min(...numbers): number",
    documentation: "Returns the minimum value among its arguments.",
    asSnippet: true,
  },
  {
    label: "math.clamp",
    kind: "function",
    insertText: "math.clamp(${1:value}, ${2:min}, ${3:max})",
    detail: "math.clamp(n, min, max): number",
    documentation: "Clamps n between min and max.",
    asSnippet: true,
  },
  {
    label: "math.sqrt",
    kind: "function",
    insertText: "math.sqrt(${1:value})",
    detail: "math.sqrt(x: number): number",
    documentation: "Returns the square root of x.",
    asSnippet: true,
  },
  {
    label: "math.huge",
    kind: "variable",
    insertText: "math.huge",
    detail: "number",
    documentation: "Positive infinity. Useful as an initial value for minimum searches.",
  },
  {
    label: "math.pi",
    kind: "variable",
    insertText: "math.pi",
    detail: "number",
    documentation: "The mathematical constant π (≈ 3.14159).",
  },

  // ── Luau-specific ─────────────────────────────────────────────────────────────
  {
    label: "buffer.create",
    kind: "function",
    insertText: "buffer.create(${1:size})",
    detail: "buffer.create(size: number): buffer",
    documentation: "Creates a new Luau buffer of the given byte size.",
    asSnippet: true,
  },
  {
    label: "bit32.band",
    kind: "function",
    insertText: "bit32.band(${1:a}, ${2:b})",
    detail: "bit32.band(...numbers): number",
    documentation: "Bitwise AND of all given 32-bit integers.",
    asSnippet: true,
  },
  {
    label: "bit32.bor",
    kind: "function",
    insertText: "bit32.bor(${1:a}, ${2:b})",
    detail: "bit32.bor(...numbers): number",
    documentation: "Bitwise OR of all given 32-bit integers.",
    asSnippet: true,
  },
  {
    label: "bit32.bxor",
    kind: "function",
    insertText: "bit32.bxor(${1:a}, ${2:b})",
    detail: "bit32.bxor(...numbers): number",
    documentation: "Bitwise XOR of all given 32-bit integers.",
    asSnippet: true,
  },
  {
    label: "bit32.lshift",
    kind: "function",
    insertText: "bit32.lshift(${1:n}, ${2:bits})",
    detail: "bit32.lshift(n, disp): number",
    documentation: "Left-shifts a 32-bit integer by disp bits.",
    asSnippet: true,
  },
  {
    label: "bit32.rshift",
    kind: "function",
    insertText: "bit32.rshift(${1:n}, ${2:bits})",
    detail: "bit32.rshift(n, disp): number",
    documentation: "Right-shifts a 32-bit integer by disp bits.",
    asSnippet: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const getCompletionKind = (monaco: Monaco, kind: SymbolKind) => {
  switch (kind) {
    case "function":  return monaco.languages.CompletionItemKind.Function;
    case "property":  return monaco.languages.CompletionItemKind.Property;
    case "class":     return monaco.languages.CompletionItemKind.Class;
    case "module":    return monaco.languages.CompletionItemKind.Module;
    case "keyword":   return monaco.languages.CompletionItemKind.Keyword;
    case "event":     return monaco.languages.CompletionItemKind.Event;
    default:          return monaco.languages.CompletionItemKind.Variable;
  }
};

const buildLookupTable = () => {
  const lookup = new Map<string, RobloxSymbol>();
  for (const symbol of ROBLOX_SYMBOLS) {
    lookup.set(symbol.label, symbol);
    for (const alias of symbol.aliases ?? []) {
      lookup.set(alias, symbol);
    }
    const parts = symbol.label.split(/[.:]/);
    const dottedPart = parts.at(-1);
    if (dottedPart) lookup.set(dottedPart, symbol);
    if (parts.length > 1) lookup.set(symbol.label, symbol);
  }
  return lookup;
};

const ROBLOX_LOOKUP = buildLookupTable();

// ── Registration de-duplication ────────────────────────────────────────────────

type IntellisenseRegistration = {
  refCount: number;
  dispose: () => void;
};

const registrationStore = new WeakMap<Monaco, IntellisenseRegistration>();

// ── Public API ─────────────────────────────────────────────────────────────────

export const configureRobloxLuaIntellisense = (monaco: Monaco) => {
  const existingRegistration = registrationStore.get(monaco);
  if (existingRegistration) {
    existingRegistration.refCount += 1;
    return () => {
      existingRegistration.refCount -= 1;
      if (existingRegistration.refCount <= 0) {
        existingRegistration.dispose();
        registrationStore.delete(monaco);
      }
    };
  }

  // ── Completion provider ──────────────────────────────────────────────────────
  const completionProvider = monaco.languages.registerCompletionItemProvider("lua", {
    // Trigger on "." and ":" for member access, plus letters for keyword/global lookup
    triggerCharacters: [".", ":"],

    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);

      // Only show suggestions when the user has typed at least 2 characters
      // (prevents the list from popping up on every single keystroke).
      if (word.word.length < 2 && !word.word) {
        // Still allow trigger-character completion (after "." / ":").
        const linePrefix = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
        if (!linePrefix.endsWith(".") && !linePrefix.endsWith(":")) {
          return { suggestions: [] };
        }
      }

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
      const isMethod   = lineContent.endsWith(":");
      const isProperty = lineContent.endsWith(".");
      const isContext  = isMethod || isProperty;

      const suggestions: Array<{
        label: string;
        kind: number;
        insertText: string;
        range: typeof range;
        insertTextRules?: number;
        detail?: string;
        documentation?: { value: string; isTrusted: true };
        sortText?: string;
      }> = [];

      if (!isContext) {
        // ── Top-level completions: keywords + globals ────────────────────────
        suggestions.push(...LUA_KEYWORDS.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          // Sort keywords to the bottom of the list
          sortText: "z" + keyword,
        })));

        suggestions.push(...ROBLOX_SYMBOLS
          .filter(s => !s.label.includes(".") && !s.label.includes(":"))
          .map(symbol => ({
            label: symbol.label,
            kind: getCompletionKind(monaco, symbol.kind),
            insertText: symbol.insertText,
            insertTextRules: symbol.asSnippet
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            detail: symbol.detail,
            documentation: { value: symbol.documentation, isTrusted: true },
            range,
            // Boost Roblox globals above keywords
            sortText: "a" + symbol.label,
          }))
        );
      } else {
        // ── Member access completions: after "." or ":" ──────────────────────
        const match = lineContent.match(/([a-zA-Z0-9_]+)[.:]$/);
        const parentName = match ? match[1] : null;

        suggestions.push(...ROBLOX_SYMBOLS
          .filter(symbol => {
            if (parentName) {
              if (symbol.label.startsWith(parentName + (isMethod ? ":" : "."))) return true;
              if (isMethod && symbol.label.startsWith("Instance:")) return true;
            }
            if (isMethod)   return symbol.label.includes(":") || (symbol.kind === "function" && !symbol.label.includes("."));
            if (isProperty) return symbol.label.includes(".") || symbol.kind === "property" || symbol.kind === "event";
            return false;
          })
          .map((symbol) => {
            let insertText = symbol.insertText;
            const parts  = symbol.label.split(/[.:]/);
            const prefix = parts[0] + (symbol.label.includes(":") ? ":" : ".");
            if (insertText.startsWith(prefix)) {
              insertText = insertText.substring(prefix.length);
            }
            return {
              label: parts.at(-1) || symbol.label,
              kind: getCompletionKind(monaco, symbol.kind),
              insertText,
              insertTextRules: symbol.asSnippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              detail: symbol.detail,
              documentation: { value: symbol.documentation, isTrusted: true },
              range,
            };
          })
        );
      }

      return { suggestions };
    },
  });

  // ── Hover provider ───────────────────────────────────────────────────────────
  const hoverProvider = monaco.languages.registerHoverProvider("lua", {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const startIdx    = Math.max(0, word.startColumn - 20);
      const contextText = lineContent.substring(startIdx, word.endColumn - 1);
      const pathMatch   = contextText.match(/([a-zA-Z0-9_]+[:.][a-zA-Z0-9_]+)$/);
      const symbol      = (pathMatch ? ROBLOX_LOOKUP.get(pathMatch[0]) : null) || ROBLOX_LOOKUP.get(word.word);

      if (!symbol) return null;

      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [
          { value: `**${symbol.label}**` },
          { value: `**Type**: ${symbol.kind}` },
          { value: "```lua\n" + symbol.detail + "\n```" },
          { value: symbol.documentation },
        ],
      };
    },
  });

  // ── Dispose ──────────────────────────────────────────────────────────────────
  const dispose = () => {
    completionProvider.dispose();
    hoverProvider.dispose();
  };

  registrationStore.set(monaco, { refCount: 1, dispose });

  return () => {
    const registration = registrationStore.get(monaco);
    if (!registration) return;
    registration.refCount -= 1;
    if (registration.refCount <= 0) {
      registration.dispose();
      registrationStore.delete(monaco);
    }
  };
};
