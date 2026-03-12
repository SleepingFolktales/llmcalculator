# Icons

Place your app icons here. Tauri expects these exact filenames:

```
32x32.png
128x128.png
128x128@2x.png
icon.icns      (macOS)
icon.ico       (Windows)
```

## Quick way to generate all sizes from one source image

1. Place a high-resolution (1024×1024) PNG at `icon.png` in this folder.
2. Run from the `desktop/` directory:
   ```bash
   npx @tauri-apps/cli icon ../src-tauri/icons/icon.png
   ```
   This auto-generates all required sizes.

## Placeholder

Until icons are added, Tauri will use its default Tauri icon during development.
The build **will fail** if icon files are missing in a release build.
