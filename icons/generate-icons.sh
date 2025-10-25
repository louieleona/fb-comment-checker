#!/bin/bash
# Generate placeholder icons using ImageMagick (if available)
if command -v convert &> /dev/null; then
    convert -size 16x16 xc:#1877f2 -fill white -draw "line 4,8 6,10 line 6,10 12,4" icon16.png
    convert -size 48x48 xc:#1877f2 -fill white -draw "line 12,24 18,30 line 18,30 36,12" icon48.png
    convert -size 128x128 xc:#1877f2 -fill white -draw "line 32,64 48,80 line 48,80 96,32" icon128.png
    echo "Icons created successfully!"
else
    echo "ImageMagick not installed. Please create icons manually using the SVG file."
    echo "See README.md for instructions."
fi
