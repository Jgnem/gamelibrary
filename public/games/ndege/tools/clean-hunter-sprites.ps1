param(
  [string]$InputPath = (Join-Path $PSScriptRoot '..\assets\hunter\hunter-prone-frames.png'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\assets\hunter\hunter-prone-frames-clean.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if (-not ('HunterSpriteCleaner' -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class HunterSpriteCleaner
{
    public static void Clean(string inputPath, string outputPath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = new Bitmap(
            loaded.Width,
            loaded.Height,
            PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source))
            {
                graphics.CompositingMode =
                    System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                graphics.DrawImageUnscaled(loaded, 0, 0);
            }

            int width = source.Width;
            int height = source.Height;
            var rect = new Rectangle(0, 0, width, height);
            var sourceData = source.LockBits(
                rect,
                ImageLockMode.ReadOnly,
                PixelFormat.Format32bppArgb);
            int stride = sourceData.Stride;
            var sourceBytes = new byte[stride * height];
            Marshal.Copy(
                sourceData.Scan0,
                sourceBytes,
                0,
                sourceBytes.Length);
            source.UnlockBits(sourceData);

            int pixelCount = width * height;
            var visible = new bool[pixelCount];
            var haloCandidate = new bool[pixelCount];
            var removedHalo = new bool[pixelCount];

            // 1. Select pale, low-chroma outline colors. Bright colored artwork
            // is excluded from this mask.
            for (int y = 0; y < height; y++)
            {
                int row = y * stride;
                for (int x = 0; x < width; x++)
                {
                    int p = y * width + x;
                    int i = row + x * 4;
                    int alpha = sourceBytes[i + 3];
                    if (alpha <= 8) continue;

                    visible[p] = true;
                    int blue = sourceBytes[i];
                    int green = sourceBytes[i + 1];
                    int red = sourceBytes[i + 2];
                    int max = Math.Max(red, Math.Max(green, blue));
                    int min = Math.Min(red, Math.Min(green, blue));
                    int chroma = max - min;
                    double luma =
                        0.2126 * red + 0.7152 * green + 0.0722 * blue;

                    if (luma > 150 && chroma < 58)
                        haloCandidate[p] = true;
                }
            }

            // Remove only selected pixels connected to transparency. Internal
            // rifle and face highlights therefore survive.
            for (int pass = 0; pass < 7; pass++)
            {
                bool changed = false;
                var next = (bool[])removedHalo.Clone();
                for (int y = 1; y < height - 1; y++)
                {
                    for (int x = 1; x < width - 1; x++)
                    {
                        int p = y * width + x;
                        if (!haloCandidate[p] || removedHalo[p]) continue;

                        bool touchesOutside =
                            !visible[p - 1] ||
                            !visible[p + 1] ||
                            !visible[p - width] ||
                            !visible[p + width] ||
                            removedHalo[p - 1] ||
                            removedHalo[p + 1] ||
                            removedHalo[p - width] ||
                            removedHalo[p + width];

                        if (!touchesOutside) continue;
                        next[p] = true;
                        changed = true;
                    }
                }
                removedHalo = next;
                if (!changed) break;
            }

            var cleanMask = new bool[pixelCount];
            for (int p = 0; p < pixelCount; p++)
                cleanMask[p] = visible[p] && !removedHalo[p];

            // 2. Contract the remaining silhouette by one source pixel.
            var coreMask = new bool[pixelCount];
            for (int y = 1; y < height - 1; y++)
            {
                for (int x = 1; x < width - 1; x++)
                {
                    int p = y * width + x;
                    coreMask[p] =
                        cleanMask[p] &&
                        cleanMask[p - 1] &&
                        cleanMask[p + 1] &&
                        cleanMask[p - width] &&
                        cleanMask[p + width];
                }
            }

            var outputBytes = new byte[sourceBytes.Length];
            for (int y = 0; y < height; y++)
            {
                int row = y * stride;
                for (int x = 0; x < width; x++)
                {
                    int p = y * width + x;
                    if (!coreMask[p]) continue;
                    int i = row + x * 4;
                    outputBytes[i] = sourceBytes[i];
                    outputBytes[i + 1] = sourceBytes[i + 1];
                    outputBytes[i + 2] = sourceBytes[i + 2];
                    outputBytes[i + 3] = sourceBytes[i + 3];
                }
            }

            // 3. Rebuild a one-pixel antialiased edge from adjacent artwork
            // colors. Transparent pixels remain zero-black, never hidden white.
            for (int y = 1; y < height - 1; y++)
            {
                int row = y * stride;
                for (int x = 1; x < width - 1; x++)
                {
                    int p = y * width + x;
                    if (coreMask[p]) continue;

                    int[] neighbors =
                    {
                        p - 1, p + 1, p - width, p + width
                    };
                    int count = 0;
                    int sumBlue = 0;
                    int sumGreen = 0;
                    int sumRed = 0;
                    foreach (int neighbor in neighbors)
                    {
                        if (!coreMask[neighbor]) continue;
                        int ny = neighbor / width;
                        int nx = neighbor - ny * width;
                        int ni = ny * stride + nx * 4;
                        sumBlue += sourceBytes[ni];
                        sumGreen += sourceBytes[ni + 1];
                        sumRed += sourceBytes[ni + 2];
                        count++;
                    }

                    if (count == 0) continue;
                    int i = row + x * 4;
                    outputBytes[i] =
                        (byte)Math.Round((double)sumBlue / count);
                    outputBytes[i + 1] =
                        (byte)Math.Round((double)sumGreen / count);
                    outputBytes[i + 2] =
                        (byte)Math.Round((double)sumRed / count);
                    outputBytes[i + 3] =
                        (byte)Math.Min(192, 56 + count * 34);
                }
            }

            // 4. Save the permanent transparent PNG.
            using (var output = new Bitmap(
                width,
                height,
                PixelFormat.Format32bppArgb))
            {
                var outputData = output.LockBits(
                    rect,
                    ImageLockMode.WriteOnly,
                    PixelFormat.Format32bppArgb);
                Marshal.Copy(
                    outputBytes,
                    0,
                    outputData.Scan0,
                    outputBytes.Length);
                output.UnlockBits(outputData);

                string tempPath = outputPath + ".tmp.png";
                output.Save(tempPath, ImageFormat.Png);
                if (File.Exists(outputPath)) File.Delete(outputPath);
                File.Move(tempPath, outputPath);
            }
        }
    }
}
'@
}

$inputFullPath = [System.IO.Path]::GetFullPath($InputPath)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
[HunterSpriteCleaner]::Clean($inputFullPath, $outputFullPath)

$result = [System.Drawing.Image]::FromFile($outputFullPath)
try {
  Write-Host "Cleaned hunter sheet: $outputFullPath ($($result.Width)x$($result.Height))"
}
finally {
  $result.Dispose()
}
