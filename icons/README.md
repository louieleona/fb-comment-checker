# Extension Icons

To create the required PNG icons for the Chrome extension:

## Option 1: Use an online converter
1. Go to an SVG to PNG converter (e.g., https://cloudconvert.com/svg-to-png)
2. Upload `icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 pixels (save as `icon16.png`)
   - 48x48 pixels (save as `icon48.png`)
   - 128x128 pixels (save as `icon128.png`)

## Option 2: Use ImageMagick (if installed)
```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## Option 3: Use the HTML generator
1. Open `create-icons.html` in a browser
2. It will automatically download all three icon sizes

## Temporary Solution
For testing, you can use placeholder icons. The extension will work without icons, but Chrome will show a default placeholder in the toolbar.
