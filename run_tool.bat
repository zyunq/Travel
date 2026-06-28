@echo off
echo ========================================================
echo Python Seat Table Generator
echo ========================================================
echo.

echo Step 1: Checking Python...
python --version
if errorlevel 1 (
    echo.
    echo [ERROR] Python is not installed!
    echo.
    echo Please install Python first:
    echo 1. Visit: https://www.python.org/downloads/
    echo 2. Download and install Python
    echo 3. Make sure to check "Add Python to PATH" during installation
    echo.
    echo Press any key to open Python download page...
    pause >nul
    start https://www.python.org/downloads/
    exit /b 1
)

echo.
echo Step 2: Checking openpyxl...
python -c "import openpyxl; print('openpyxl version:', openpyxl.__version__)"
if errorlevel 1 (
    echo.
    echo [INFO] Installing openpyxl...
    pip install openpyxl
    if errorlevel 1 (
        echo [ERROR] Failed to install openpyxl
        pause
        exit /b 1
    )
)

echo.
echo Step 3: Select input file
echo.
echo 1. doc\0605D2987.xlsx
echo 2. Enter file path manually
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    set INPUT_FILE=doc\0605D2987.xlsx
) else (
    set /p INPUT_FILE="Enter file path: "
)

echo.
echo Input file: %INPUT_FILE%

if not exist "%INPUT_FILE%" (
    echo [ERROR] File not found!
    pause
    exit /b 1
)

set OUTPUT_FILE=seat_table_output.xlsx
echo Output file: %OUTPUT_FILE%
echo.

echo Step 4: Generating seat table...
python tools\generate_seat_excel.py "%INPUT_FILE%" "%OUTPUT_FILE%"

if errorlevel 1 (
    echo.
    echo [ERROR] Generation failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo SUCCESS! Output file: %OUTPUT_FILE%
echo ========================================================
echo.

set /p open_file="Open output file? (Y/N): "
if /i "%open_file%"=="Y" start "" "%OUTPUT_FILE%"

echo.
echo Done! Press any key to exit...
pause >nul
