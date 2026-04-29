#!/usr/bin/env python3
"""
Deploy static site files to Volcengine TOS via the S3-compatible API.
"""

from __future__ import annotations

import hashlib
import fnmatch
import mimetypes
import os
from pathlib import Path

import boto3
from botocore.client import Config


ROOT_DIR = Path(__file__).resolve().parent.parent
IGNORE_FILE = ROOT_DIR / ".tosignore"
HARD_EXCLUDED_DIRS = {
    ".git",
}


def get_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_client():
    access_key = get_env("TOS_ACCESS_KEY_ID")
    secret_key = get_env("TOS_SECRET_ACCESS_KEY")
    endpoint = get_env("TOS_ENDPOINT")
    region = get_env("TOS_REGION")

    return boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint,
        region_name=region,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "virtual"},
        ),
    )


def load_ignore_patterns():
    if not IGNORE_FILE.is_file():
        return []

    patterns = []
    for line in IGNORE_FILE.read_text(encoding="utf-8").splitlines():
        pattern = line.strip()
        if not pattern or pattern.startswith("#"):
            continue
        patterns.append(pattern)
    return patterns


def iter_upload_files():
    ignore_patterns = load_ignore_patterns()
    for path in sorted(ROOT_DIR.rglob("*")):
        if not path.is_file():
            continue
        relative_key = path.relative_to(ROOT_DIR).as_posix()
        if should_exclude(path, relative_key, ignore_patterns):
            continue
        yield path, relative_key


def should_exclude(path: Path, relative_key: str, ignore_patterns: list[str]) -> bool:
    parts = path.relative_to(ROOT_DIR).parts
    if any(part in HARD_EXCLUDED_DIRS for part in parts[:-1]):
        return True
    for pattern in ignore_patterns:
        if matches_pattern(relative_key, pattern):
            return True
    return False


def matches_pattern(relative_key: str, pattern: str) -> bool:
    normalized_key = relative_key.strip("/")
    normalized_pattern = pattern.strip()

    if normalized_pattern.endswith("/"):
        prefix = normalized_pattern.rstrip("/")
        return normalized_key == prefix or normalized_key.startswith(f"{prefix}/")

    return fnmatch.fnmatch(normalized_key, normalized_pattern)


def guess_content_type(path: Path) -> str:
    content_type, _ = mimetypes.guess_type(path.name)
    return content_type or "application/octet-stream"


def calc_md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as file_obj:
        for chunk in iter(lambda: file_obj.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def upload_file(s3_client, bucket: str, key_prefix: str, path: Path, relative_key: str):
    object_key = f"{key_prefix}/{relative_key}" if key_prefix else relative_key
    object_key = object_key.lstrip("/")
    content_type = guess_content_type(path)
    cache_control = (
        "no-cache"
        if path.suffix == ".html"
        else "public, max-age=31536000, immutable"
    )

    with path.open("rb") as file_obj:
        s3_client.put_object(
            Bucket=bucket,
            Key=object_key,
            Body=file_obj.read(),
            ContentType=content_type,
            CacheControl=cache_control,
        )

    print(
        f"uploaded {relative_key} -> {object_key} "
        f"({content_type}, md5={calc_md5(path)})"
    )


def main():
    bucket = get_env("TOS_BUCKET")
    key_prefix = os.environ.get("TOS_KEY_PREFIX", "").strip().strip("/")
    cdn_domain = os.environ.get("TOS_CDN_DOMAIN", "").strip().rstrip("/")

    s3_client = build_client()
    upload_targets = list(iter_upload_files())
    if not upload_targets:
        raise RuntimeError("No deployable site files found")

    uploaded_keys = []

    for path, relative_key in upload_targets:
        upload_file(s3_client, bucket, key_prefix, path, relative_key)
        uploaded_keys.append(f"{key_prefix}/{relative_key}" if key_prefix else relative_key)

    print(f"uploaded {len(uploaded_keys)} files to bucket {bucket}")

    if cdn_domain:
        print("sample urls:")
        for key in uploaded_keys[:4]:
            print(f"{cdn_domain}/{key}")


if __name__ == "__main__":
    main()
