# Quick Start Guide

## Current Status

You double-clicked the batch file and saw encoding errors. This is because:
1. Python is not installed on your computer
2. The batch file had Chinese characters with wrong encoding

## Solution (Choose One)

### Option A: Install Python (Recommended) ⭐

**Step 1: Install Python**

Double-click: `install_python.bat`

This will:
- Open Python download page
- Show you installation instructions

**Step 2: Important Setting** ⚠️

When installing, you MUST check this option:

```
[V] Add Python 3.x to PATH
```

This is at the bottom of the installer window!

**Step 3: Run Tool**

After installation, double-click: `generate_seat_table.bat`

### Option B: Use Node.js Version (No Python needed)

If you don't want to install Python:

1. Restart your backend server
2. Use the web interface to export seat table
3. All carriages will be shown on one page (already fixed)

## Files Created

1. ✅ `install_python.bat` - Opens Python download page
2. ✅ `generate_seat_table.bat` - Main tool (requires Python)
3. ✅ `tools/generate_seat_excel.py` - Python script

## Installation Screenshot

The installer should look like this:

```
+------------------------------------------+
|  Python 3.12.0 Setup                     |
+------------------------------------------+
|                                          |
|  [V] Install launcher for all users      |
|                                          |
|  [V] Add Python 3.12 to PATH  <- CHECK!  |
|                                          |
|  [ Install Now ]  [ Customize ]          |
+------------------------------------------+
```

## What's Different

### Python Version (Better)
- Professional 3+2 seat layout (A/B/C + D/F)
- Two worksheets: Passenger info + Seat table
- Automatic data cleaning
- Date format conversion

### Node.js Version (Simpler)
- Already working (no installation needed)
- All carriages on one page
- Simple styling

## Next Steps

**For Python Version:**
1. Run `install_python.bat`
2. Install Python (check "Add to PATH")
3. Run `generate_seat_table.bat`

**For Node.js Version:**
1. Restart backend server
2. Use web interface to export

Choose the option that works best for you!
