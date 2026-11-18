#!/usr/bin/env python3
"""Minimal stdio MCP server for OpenAI GPT Image models (no dependencies).

Env:
  OPENAI_API_KEY   - API key (in Claude cloud sessions the proxy injects it; any placeholder works)
  GPT_IMAGE_MODEL  - default model (default: gpt-image-2.6-sunburst)
  GPT_IMAGE_OUTDIR - where images are saved (default: ./generated-images)
"""
import base64, json, mimetypes, os, sys, time, urllib.request, urllib.error, uuid

API = "https://api.openai.com/v1"
DEFAULT_MODEL = os.environ.get("GPT_IMAGE_MODEL", "gpt-image-2.6-sunburst")
OUTDIR = os.environ.get("GPT_IMAGE_OUTDIR", "generated-images")
MODELS = ["gpt-image-2.6-sunburst", "gpt-image-2.6-flare", "gpt-image-2", "gpt-image-1.5", "gpt-image-1-mini"]

COMMON = {
    "prompt": {"type": "string", "description": "Description of the image"},
    "model": {"type": "string", "enum": MODELS, "description": f"Default {DEFAULT_MODEL}"},
    "size": {"type": "string", "description": "e.g. 1024x1024, 1536x1024, 1024x1536, auto"},
    "quality": {"type": "string", "enum": ["low", "medium", "high", "auto"]},
    "n": {"type": "integer", "minimum": 1, "maximum": 4},
    "filename": {"type": "string", "description": "Base filename (without extension)"},
}
TOOLS = [
    {"name": "generate_image", "description": "Generate image(s) from a text prompt with GPT Image. Saves PNGs and returns their paths.",
     "inputSchema": {"type": "object", "properties": {**COMMON, "background": {"type": "string", "enum": ["transparent", "opaque", "auto"]}}, "required": ["prompt"]}},
    {"name": "edit_image", "description": "Edit or combine existing image file(s) using a prompt (optionally with a PNG mask).",
     "inputSchema": {"type": "object", "properties": {**COMMON,
        "image_paths": {"type": "array", "items": {"type": "string"}, "description": "Local paths of input images"},
        "mask_path": {"type": "string"}}, "required": ["prompt", "image_paths"]}},
]

def _headers(ct):
    return {"Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY', 'proxy-injected')}", "Content-Type": ct}

def _post(path, body, ct):
    req = urllib.request.Request(API + path, data=body, headers=_headers(ct), method="POST")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenAI {e.code}: {e.read().decode(errors='replace')}")

def _multipart(fields, files):
    b = uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        out += f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for k, p in files:
        mt = mimetypes.guess_type(p)[0] or "application/octet-stream"
        out += f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{os.path.basename(p)}\"\r\nContent-Type: {mt}\r\n\r\n".encode()
        out += open(p, "rb").read() + b"\r\n"
    out += f"--{b}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={b}"

def _save(resp, base):
    os.makedirs(OUTDIR, exist_ok=True)
    paths = []
    for i, d in enumerate(resp.get("data", [])):
        p = os.path.abspath(os.path.join(OUTDIR, f"{base}{'' if i == 0 else f'-{i+1}'}.png"))
        with open(p, "wb") as f:
            f.write(base64.b64decode(d["b64_json"]))
        paths.append(p)
    return paths

def _opts(a):
    o = {"model": a.get("model") or DEFAULT_MODEL, "prompt": a["prompt"]}
    for k in ("size", "quality", "n", "background"):
        if a.get(k) is not None:
            o[k] = a[k]
    return o

def call(name, a):
    base = a.get("filename") or f"image-{time.strftime('%Y%m%d-%H%M%S')}"
    o = _opts(a)
    if name == "generate_image":
        resp = _post("/images/generations", json.dumps(o).encode(), "application/json")
    elif name == "edit_image":
        files = [("image[]", p) for p in a["image_paths"]]
        if a.get("mask_path"):
            files.append(("mask", a["mask_path"]))
        body, ct = _multipart(o, files)
        resp = _post("/images/edits", body, ct)
    else:
        raise RuntimeError(f"Unknown tool {name}")
    paths = _save(resp, base)
    return f"Model: {o['model']}\nSaved {len(paths)} image(s):\n" + "\n".join(paths)

def send(msg):
    sys.stdout.write(json.dumps(msg) + "\n"); sys.stdout.flush()

def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        m = json.loads(line)
        mid, meth = m.get("id"), m.get("method")
        if mid is None:
            continue  # notification
        if meth == "initialize":
            res = {"protocolVersion": m.get("params", {}).get("protocolVersion", "2025-06-18"),
                   "capabilities": {"tools": {}}, "serverInfo": {"name": "gpt-image", "version": "1.0.0"}}
        elif meth == "tools/list":
            res = {"tools": TOOLS}
        elif meth == "tools/call":
            p = m["params"]
            try:
                res = {"content": [{"type": "text", "text": call(p["name"], p.get("arguments", {}))}]}
            except Exception as e:
                res = {"content": [{"type": "text", "text": f"Error: {e}"}], "isError": True}
        elif meth == "ping":
            res = {}
        else:
            send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Method not found: {meth}"}}); continue
        send({"jsonrpc": "2.0", "id": mid, "result": res})

if __name__ == "__main__":
    main()
