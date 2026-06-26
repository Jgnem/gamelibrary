param(
  [string]$AssetDirectory = (Join-Path $PSScriptRoot '..\assets\bird'),
  [int]$FrameWidth = 512,
  [int]$FrameHeight = 512,
  [int]$FrameCount = 6,
  [int]$Padding = 18
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Get-CleanBitmap {
  param([string]$Path)

  $source = [System.Drawing.Bitmap]::FromFile($Path)
  $bitmap = New-Object System.Drawing.Bitmap(
    $source.Width,
    $source.Height,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.DrawImageUnscaled($source, 0, 0)
  $graphics.Dispose()
  $source.Dispose()

  $rect = New-Object System.Drawing.Rectangle(0, 0, $bitmap.Width, $bitmap.Height)
  $data = $bitmap.LockBits(
    $rect,
    [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  try {
    $bytes = New-Object byte[] ($data.Stride * $data.Height)
    [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

    for ($y = 0; $y -lt $data.Height; $y++) {
      $row = $y * $data.Stride
      for ($x = 0; $x -lt $data.Width; $x++) {
        $i = $row + $x * 4
        $b = [int]$bytes[$i]
        $g = [int]$bytes[$i + 1]
        $r = [int]$bytes[$i + 2]
        $max = [Math]::Max($r, [Math]::Max($g, $b))
        $min = [Math]::Min($r, [Math]::Min($g, $b))
        if (($max - $min) -lt 24 -and $max -gt 218) {
          $bytes[$i + 3] = 0
        }
      }
    }

    [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  }
  finally {
    $bitmap.UnlockBits($data)
  }

  return $bitmap
}

function Get-FrameBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$Count
  )

  $rect = New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  $data = $Bitmap.LockBits(
    $rect,
    [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  try {
    $bytes = New-Object byte[] ($data.Stride * $data.Height)
    [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $bounds = @()
    $columnOccupied = New-Object bool[] $Bitmap.Width

    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        if ($bytes[$y * $data.Stride + $x * 4 + 3] -gt 8) {
          $columnOccupied[$x] = $true
          break
        }
      }
    }

    $runs = @()
    $runStart = -1
    for ($x = 0; $x -le $Bitmap.Width; $x++) {
      $occupied = $x -lt $Bitmap.Width -and $columnOccupied[$x]
      if ($occupied -and $runStart -lt 0) {
        $runStart = $x
      }
      elseif (-not $occupied -and $runStart -ge 0) {
        $runWidth = $x - $runStart
        if ($runWidth -gt 4) {
          $runs += New-Object System.Drawing.Rectangle($runStart, 0, $runWidth, $Bitmap.Height)
        }
        $runStart = -1
      }
    }

    if ($runs.Count -lt $Count) {
      throw "Expected at least $Count separated frame groups, found $($runs.Count)."
    }

    $anchors = @(
      $runs |
        Sort-Object Width -Descending |
        Select-Object -First $Count |
        Sort-Object X
    )

    for ($frame = 0; $frame -lt $Count; $frame++) {
      $anchor = $anchors[$frame]
      $anchorCenter = $anchor.X + $anchor.Width / 2
      $searchStart = if ($frame -eq 0) {
        0
      } else {
        $previous = $anchors[$frame - 1]
        [int][Math]::Floor((($previous.X + $previous.Width / 2) + $anchorCenter) / 2)
      }
      $searchEnd = if ($frame -eq $Count - 1) {
        $Bitmap.Width - 1
      } else {
        $next = $anchors[$frame + 1]
        [int][Math]::Floor(($anchorCenter + ($next.X + $next.Width / 2)) / 2) - 1
      }

      $minX = $searchEnd
      $minY = $Bitmap.Height - 1
      $maxX = $searchStart
      $maxY = 0
      $found = $false

      for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        $row = $y * $data.Stride
        for ($x = $searchStart; $x -le $searchEnd; $x++) {
          if ($bytes[$row + $x * 4 + 3] -gt 8) {
            $found = $true
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
          }
        }
      }

      if (-not $found) {
        throw "Frame $frame contains no visible pixels."
      }

      $sourceWidth = $maxX - $minX + 1
      $sourceHeight = $maxY - $minY + 1
      $bounds += New-Object System.Drawing.Rectangle(
        $minX,
        $minY,
        $sourceWidth,
        $sourceHeight
      )
    }
    return $bounds
  }
  finally {
    $Bitmap.UnlockBits($data)
  }
}

function Repack-SpriteSheet {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  $source = Get-CleanBitmap -Path $InputPath
  try {
    $bounds = Get-FrameBounds -Bitmap $source -Count $FrameCount
    $output = New-Object System.Drawing.Bitmap(
      ($FrameWidth * $FrameCount),
      $FrameHeight,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($output)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        for ($frame = 0; $frame -lt $FrameCount; $frame++) {
          $src = $bounds[$frame]
          $maxWidth = $FrameWidth - 2 * $Padding
          $maxHeight = $FrameHeight - 2 * $Padding
          $scale = [Math]::Min(1.0, [Math]::Min($maxWidth / $src.Width, $maxHeight / $src.Height))
          $drawWidth = [int][Math]::Round($src.Width * $scale)
          $drawHeight = [int][Math]::Round($src.Height * $scale)
          $drawX = $frame * $FrameWidth + [int][Math]::Floor(($FrameWidth - $drawWidth) / 2)
          $drawY = [int][Math]::Floor(($FrameHeight - $drawHeight) / 2)
          $dest = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawWidth, $drawHeight)

          $graphics.DrawImage(
            $source,
            $dest,
            $src.X,
            $src.Y,
            $src.Width,
            $src.Height,
            [System.Drawing.GraphicsUnit]::Pixel
          )
        }
      }
      finally {
        $graphics.Dispose()
      }

      $tempPath = "$OutputPath.repack.tmp.png"
      $output.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $output.Dispose()
    }
    Move-Item -LiteralPath $tempPath -Destination $OutputPath -Force
  }
  finally {
    $source.Dispose()
  }
}

$jobs = @(
  @{ Input = 'fly_loop.png.png'; Output = 'fly_loop.png' },
  @{ Input = 'assetsbirdidle_loop.png.png'; Output = 'idle_loop.png' },
  @{ Input = 'hit.png.png'; Output = 'hit.png' },
  @{ Input = 'death_explosion.png.png'; Output = 'death_explosion.png' }
)

$assetRoot = [System.IO.Path]::GetFullPath($AssetDirectory)
foreach ($job in $jobs) {
  $inputPath = Join-Path $assetRoot $job.Input
  $outputPath = Join-Path $assetRoot $job.Output
  if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Missing source spritesheet: $inputPath"
  }
  Repack-SpriteSheet -InputPath $inputPath -OutputPath $outputPath
  Write-Host "Repacked $($job.Output) -> $($FrameWidth * $FrameCount)x$FrameHeight"
}
