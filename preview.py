#!/usr/bin/env python3
"""
PowerUpEnglish - Local Preview and Static Builder for Jekyll / GitHub Pages
Builds the static site to `_site/` and serves it locally at http://localhost:4000
Compatible with Python 3.9+ without requiring Ruby or Jekyll to be installed.
"""

import sys
import os
import shutil
import time
import argparse
import http.server
import socketserver
import pathlib
import re
from ruamel.yaml import YAML
import liquid

# Configure UTF-8 for console output on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

yaml = YAML(typ='safe')

BASE_DIR = pathlib.Path(__file__).resolve().parent
SITE_DIR = BASE_DIR / "_site"
INCLUDES_DIR = BASE_DIR / "_includes"
LAYOUTS_DIR = BASE_DIR / "_layouts"
DATA_DIR = BASE_DIR / "_data"
ASSETS_DIR = BASE_DIR / "assets"

def jekyll_normalize(content: str) -> str:
    """Normalize Jekyll tags (e.g. unquoted {% include file.ext %}) for standard Liquid engine."""
    return re.sub(
        r'\{%\s*include\s+([a-zA-Z0-9_\-\./]+\.[a-zA-Z0-9]+)(\s*.*?)%\}',
        r'{% include "\1"\2 %}',
        content
    )

class JekyllFileSystemLoader(liquid.FileSystemLoader):
    def get_source(self, env, template_name, **kwargs):
        source, full_name, uptodate, matter = super().get_source(env, template_name, **kwargs)
        return jekyll_normalize(source), full_name, uptodate, matter

def parse_front_matter(content: str):
    """Split front matter YAML from document body."""
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2]
            try:
                fm_data = yaml.load(fm_text) or {}
            except Exception as e:
                print(f"[!] Warning parsing front matter: {e}")
                fm_data = {}
            return fm_data, body
    return {}, content

def build_site():
    print("=" * 60)
    print(" PowerUpEnglish - Building Jekyll Site for GitHub Pages")
    print("=" * 60)
    start_time = time.time()

    # Clean and recreate _site
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    # Copy assets
    if ASSETS_DIR.exists():
        shutil.copytree(ASSETS_DIR, SITE_DIR / "assets")
        print(" [OK] Copied assets/ directory")

    # Load _config.yml
    site_config = {
        "title": "PowerUpEnglish",
        "baseurl": "",
        "url": "http://localhost:4000",
        "description": "Resources to learn English organized by CEFR levels"
    }
    config_file = BASE_DIR / "_config.yml"
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            cfg = yaml.load(f)
            if cfg:
                site_config.update(cfg)

    # Load _data
    site_data = {}
    if DATA_DIR.exists():
        for yml_file in DATA_DIR.glob("*.yml"):
            with open(yml_file, "r", encoding="utf-8") as f:
                data_content = yaml.load(f)
                site_data[yml_file.stem] = data_content
    site_config["data"] = site_data

    # Setup Liquid environment
    loader = JekyllFileSystemLoader(search_path=[INCLUDES_DIR, LAYOUTS_DIR])
    env = liquid.Environment(loader=loader)

    # Register custom Jekyll filters
    baseurl = site_config.get("baseurl", "")
    env.filters['relative_url'] = lambda val: f"{baseurl}{val}" if str(val).startswith("/") else f"{baseurl}/{val}"
    env.filters['absolute_url'] = lambda val: f"{site_config.get('url', '')}{baseurl}{val}"

    # Load Layouts
    layouts = {}
    if LAYOUTS_DIR.exists():
        for l_file in LAYOUTS_DIR.glob("*.html"):
            with open(l_file, "r", encoding="utf-8") as f:
                l_fm, l_body = parse_front_matter(f.read())
                layouts[l_file.stem] = (l_fm, jekyll_normalize(l_body))

    # Find all source HTML files with front matter
    source_files = [BASE_DIR / "index.html"]
    for level in ["a1", "a2", "b1", "b2", "c1", "c2"]:
        lvl_dir = BASE_DIR / level
        if lvl_dir.exists():
            for p in sorted(lvl_dir.glob("*.html")):
                source_files.append(p)

    rendered_count = 0

    for src_path in source_files:
        if not src_path.exists():
            continue

        rel_path = src_path.relative_to(BASE_DIR)
        out_path = SITE_DIR / rel_path
        out_path.parent.mkdir(parents=True, exist_ok=True)

        with open(src_path, "r", encoding="utf-8") as f:
            raw_content = f.read()

        page_meta, page_body = parse_front_matter(raw_content)

        # Context setup
        page_dict = dict(page_meta)
        # Ensure url is present
        page_dict["url"] = f"/{rel_path.as_posix()}"
        if rel_path.name == "index.html" and rel_path.parent == pathlib.Path("."):
            page_dict["url"] = "/"

        # Render page body first
        template = env.from_string(jekyll_normalize(page_body))
        rendered_body = template.render(page=page_dict, site=site_config)

        # Handle layouts
        current_content = rendered_body
        current_layout = page_meta.get("layout")

        # Support layout inheritance (e.g. topic -> default)
        visited_layouts = set()
        while current_layout and current_layout in layouts and current_layout not in visited_layouts:
            visited_layouts.add(current_layout)
            parent_fm, layout_body = layouts[current_layout]
            layout_template = env.from_string(layout_body)
            current_content = layout_template.render(
                content=current_content,
                page=page_dict,
                site=site_config
            )
            current_layout = parent_fm.get("layout")

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(current_content)

        rendered_count += 1
        print(f" [OK] Rendered: {rel_path.as_posix()} -> {out_path.relative_to(BASE_DIR).as_posix()}")

    elapsed = time.time() - start_time
    print("-" * 60)
    print(f" Built {rendered_count} pages successfully in {elapsed:.2f}s!")
    print(f" Output folder: {SITE_DIR}")
    print("=" * 60)
    return rendered_count

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        sys.stdout.write(f" [HTTP] {self.address_string()} - {args[0]} {args[1]}\n")
        sys.stdout.flush()

def serve_site(port=4000):
    build_site()
    print(f"\n Starting local preview server...")
    print(f" Web URL: http://localhost:{port}/")
    print(f" Press Ctrl+C to stop the server.\n")

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), QuietHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Server stopped.")
    except OSError as e:
        if "address already in use" in str(e).lower() or e.errno == 10048:
            alt_port = port + 1
            print(f" Port {port} is busy, trying http://localhost:{alt_port}/ ...")
            serve_site(alt_port)
        else:
            raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PowerUpEnglish Local Jekyll Preview Server")
    parser.add_argument("--build", action="store_true", help="Build _site directory only (no HTTP server)")
    parser.add_argument("--port", type=int, default=4000, help="HTTP port to serve on (default: 4000)")
    args = parser.parse_args()

    if args.build:
        build_site()
    else:
        serve_site(port=args.port)
