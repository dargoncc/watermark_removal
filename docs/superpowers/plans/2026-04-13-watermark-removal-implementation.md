# Watermark Removal Desktop 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS and Windows desktop app plus a FastAPI service that removes manually marked watermarks and returns the processed image.

**Architecture:** Use a pnpm workspace for the desktop app and a Python service for image inpainting. The desktop app renders a canvas editor, exports a mask PNG at original resolution, uploads the image and mask to the API, then previews and saves the result.

**Tech Stack:** Tauri, React, TypeScript, Zustand, react-konva, Vitest, FastAPI, Pillow, OpenCV, pytest

---

实施内容以 `docs/superpowers/specs/2026-04-13-watermark-removal-desktop-design.md` 为准。

