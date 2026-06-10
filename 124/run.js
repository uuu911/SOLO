const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

// ============================================================
// CONFIG - modify these values as needed
// ============================================================

const TRAE_EXE = "D:\\Trae CN\\bin\\trae-cn.cmd";
const BATCH_SIZE = 4;            // 同时打开窗口数
const WAIT_SECONDS = 600;        // 等待时间，改600=10分钟
// ============================================================

const BASE_DIR = __dirname;
const EXAMPLE_DIR = path.join(__dirname, 'example');

const ADD_TYPE_BLOCK = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
public class Win32 {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool AllowSetForegroundWindow(int dwProcessId);
    [DllImport("user32.dll")]
    public static extern bool LockSetForegroundWindow(uint uLockCode);
    public const int KEYEVENTF_KEYUP = 0x0002;
    public const int VK_CONTROL = 0x11;
    public const int VK_MENU = 0x12;
    public const int VK_V = 0x56;
    public const int VK_RETURN = 0x0D;
    public const int VK_U = 0x55;
    public const int VK_TAB = 0x09;
    public const int VK_OEM_5 = 0xDC;
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const int SW_MAXIMIZE = 3;
    public const int SW_RESTORE = 9;
    public const uint WM_CLOSE = 0x0010;
    public const uint LOCK_FOREGROUND_WINDOW = 0;
    public const uint UNLOCK_FOREGROUND_WINDOW = 1;
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
"@
`.trim();

function runPS(script) {
    const tmpFile = path.join(os.tmpdir(), 'trae_auto_' + Date.now() + '.ps1');
    fs.writeFileSync(tmpFile, script, 'utf8');
    let output = '';
    try {
        output = execSync(`powershell -ExecutionPolicy Bypass -File "${tmpFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000
        });
    } catch (e) {
        output = e.stdout || '';
    }
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    return output;
}

function findWindowHandle(targetName) {
    const script = `
${ADD_TYPE_BLOCK}

$script:tName = "${targetName}"
$script:found = [System.Collections.ArrayList]::new()

$enumProc = [Win32+EnumWindowsProc]{
    param($hWnd, $lParam)
    if ([Win32]::IsWindowVisible($hWnd)) {
        $tb = New-Object System.Text.StringBuilder(256)
        [Win32]::GetWindowText($hWnd, $tb, $tb.Capacity) | Out-Null
        $title = $tb.ToString()
        if ($title -match $script:tName) {
            $script:found.Add($hWnd) | Out-Null
        }
    }
    return $true
}
[Win32]::EnumWindows($enumProc, [IntPtr]::Zero) | Out-Null

if ($script:found.Count -gt 0) {
    Write-Host "HANDLE:$($script:found[0])"
} else {
    Write-Host "HANDLE:NOT_FOUND"
}
`.trim();
    const output = runPS(script);
    const match = output.match(/HANDLE:(\d+)/);
    return match ? match[1] : null;
}

function closeWindow(handleStr) {
    const script = `
${ADD_TYPE_BLOCK}

$hWnd = [IntPtr]::new(${handleStr})
[Win32]::PostMessage($hWnd, [Win32]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
Write-Host "CLOSED"
`.trim();
    runPS(script);
}

// Enhanced for Remote Desktop - robust window focus handling
function sendPrompt(handleStr, tempPromptFile, windowTitle) {
    const script = `
${ADD_TYPE_BLOCK}

$hWnd = [IntPtr]::new(${handleStr})
$promptFile = "${tempPromptFile}"
$targetTitle = "${windowTitle}"

Write-Host "Activating window: $targetTitle"

# Unlock foreground window (important for Remote Desktop)
[Win32]::LockSetForegroundWindow([Win32]::UNLOCK_FOREGROUND_WINDOW) | Out-Null
Start-Sleep -Milliseconds 200

# Allow setting foreground window
$processId = 0
$null = [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId)
if ($processId -gt 0) {
    [Win32]::AllowSetForegroundWindow($processId) | Out-Null
}
Start-Sleep -Milliseconds 200

# Step 1: Restore window if minimized
[Win32]::ShowWindow($hWnd, [Win32]::SW_RESTORE) | Out-Null
Start-Sleep -Milliseconds 300

# Step 2: Set topmost
[Win32]::SetWindowPos($hWnd, [Win32]::HWND_TOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_SHOWWINDOW) | Out-Null
Start-Sleep -Milliseconds 300

# Step 3: Maximize
[Win32]::ShowWindow($hWnd, [Win32]::SW_MAXIMIZE) | Out-Null
Start-Sleep -Milliseconds 500

# Step 4: Bring to top
[Win32]::BringWindowToTop($hWnd) | Out-Null
Start-Sleep -Milliseconds 300

# Step 5: Attach thread input for reliable SetForegroundWindow
$targetThreadId = [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId)
$currentThreadId = [Win32]::GetCurrentThreadId()
if ($targetThreadId -ne $currentThreadId) {
    [Win32]::AttachThreadInput($currentThreadId, $targetThreadId, $true) | Out-Null
    Start-Sleep -Milliseconds 200
}

# Step 6: Set foreground with retries
$success = $false
for ($i = 0; $i -lt 3; $i++) {
    $result = [Win32]::SetForegroundWindow($hWnd)
    if ($result) {
        $success = $true
        Write-Host "SetForegroundWindow succeeded on attempt $($i+1)"
        break
    }
    Start-Sleep -Milliseconds 500
    [Win32]::BringWindowToTop($hWnd) | Out-Null
    Start-Sleep -Milliseconds 300
}

if (-not $success) {
    Write-Host "WARNING: SetForegroundWindow failed after 3 attempts"
}

Start-Sleep -Milliseconds 800

# Detach thread input
if ($targetThreadId -ne $currentThreadId) {
    [Win32]::AttachThreadInput($currentThreadId, $targetThreadId, $false) | Out-Null
}

# Step 7: Verify foreground window
$fg = [Win32]::GetForegroundWindow()
if ($fg -ne $hWnd) {
    Write-Host "WARNING: Foreground window mismatch! Expected: $hWnd, Got: $fg"
    # Last resort: try again
    [Win32]::SetForegroundWindow($hWnd) | Out-Null
    Start-Sleep -Milliseconds 1000
    $fg = [Win32]::GetForegroundWindow()
    if ($fg -ne $hWnd) {
        Write-Host "ERROR: Still not foreground window. Paste may fail."
    }
} else {
    Write-Host "VERIFIED: This is the foreground window"
}

# Step 8: Set clipboard content
$promptText = Get-Content -Path $promptFile -Raw -Encoding UTF8
Set-Clipboard -Value $promptText
Start-Sleep -Milliseconds 500
Write-Host "Clipboard set, length: $($promptText.Length) chars"

# Step 9: Small click simulation to ensure focus (optional but helpful)
# This helps ensure the window is truly active
Start-Sleep -Milliseconds 500

Write-Host "Sending Ctrl+V paste..."
[Win32]::keybd_event([Win32]::VK_CONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[Win32]::keybd_event([Win32]::VK_V, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[Win32]::keybd_event([Win32]::VK_V, 0, [Win32]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[Win32]::keybd_event([Win32]::VK_CONTROL, 0, [Win32]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 2000

Write-Host "Sending Enter key..."
[Win32]::keybd_event([Win32]::VK_RETURN, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[Win32]::keybd_event([Win32]::VK_RETURN, 0, [Win32]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 500
[Win32]::keybd_event([Win32]::VK_RETURN, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[Win32]::keybd_event([Win32]::VK_RETURN, 0, [Win32]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 500

# Remove topmost flag
Start-Sleep -Milliseconds 500
[Win32]::SetWindowPos($hWnd, [Win32]::HWND_NOTOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_SHOWWINDOW) | Out-Null

Write-Host "DONE"
`.trim();
    const output = runPS(script);
    console.log(output);
    return output.includes('DONE');
}

function isFolderEmpty(folderPath) {
    if (!fs.existsSync(folderPath)) return true;
    const files = fs.readdirSync(folderPath);
    return files.length === 0;
}

async function main() {
    console.log('=====================================');
    console.log('  TRAE AUTO SEND');
    console.log('=====================================');
    console.log('');

    const promptFiles = fs.readdirSync(EXAMPLE_DIR)
        .filter(f => f.endsWith('.json') && !f.endsWith('_down.json'))
        .sort()
        .map(f => path.join(EXAMPLE_DIR, f));

    if (promptFiles.length === 0) {
        console.log('No pending prompts found.');
        process.exit(0);
    }

    const tasks = [];
    let autoIdx = 1;
    for (const pf of promptFiles) {
        while (true) {
            const folderName = `auto${autoIdx}`;
            const folderPath = path.join(BASE_DIR, folderName);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            if (isFolderEmpty(folderPath)) {
                tasks.push({ name: folderName, path: folderPath, promptFile: pf });
                autoIdx++;
                break;
            }
            autoIdx++;
        }
    }

    console.log(`Found ${tasks.length} pending prompts:`);
    tasks.forEach((t, i) => {
        console.log(`  ${i + 1}. ${path.basename(t.promptFile)} -> ${t.name}`);
    });
    console.log('');

    const confirm = await question('Ready to start? (Y/N) ');
    if (!confirm.toLowerCase().startsWith('y')) {
        console.log('Cancelled');
        rl.close();
        return;
    }

    const batches = [];
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        batches.push(tasks.slice(i, i + BATCH_SIZE));
    }

    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        console.log('');
        console.log('=====================================');
        console.log(`  BATCH ${b + 1}/${batches.length} (Direct Paste)`);
        batch.forEach(t => console.log(`  ${t.name}: ${path.basename(t.promptFile)}`));
        console.log('=====================================');

        console.log('Opening Trae windows...');
        for (const task of batch) {
            try {
                console.log(`  Opening: ${task.name} ...`);
                execSync(`"${TRAE_EXE}" -n "${task.path}"`, { stdio: 'ignore', timeout: 10000 });
            } catch (e) {
                console.log(`  Warning: ${e.message}`);
            }
        }

        console.log('Waiting 15 seconds for windows to load...');
        for (let i = 15; i > 0; i--) {
            console.log(`  ${i}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Finding window handles...');
        const handleMap = {};
        for (const task of batch) {
            const handle = findWindowHandle(task.name);
            if (handle) {
                handleMap[task.name] = handle;
                console.log(`  ${task.name} -> handle ${handle}`);
            } else {
                console.log(`  ${task.name} -> NOT FOUND!`);
            }
        }

        // Minimize all windows in this batch to avoid interference
        if (Object.keys(handleMap).length > 0) {
            console.log('Minimizing batch windows to prepare for sequential activation...');
            for (const task of batch) {
                const handle = handleMap[task.name];
                if (handle) {
                    const minimizeScript = `
${ADD_TYPE_BLOCK}
$hWnd = [IntPtr]::new(${handle})
[Win32]::ShowWindow($hWnd, 6)  # SW_MINIMIZE
Write-Host "MINIMIZED"
`.trim();
                    try {
                        runPS(minimizeScript);
                    } catch (e) {
                        // Ignore minimize errors
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (Object.keys(handleMap).length === 0) {
            console.log('ERROR: No windows found in this batch!');
            continue;
        }

        for (const task of batch) {
            const handle = handleMap[task.name];
            if (!handle) {
                console.log(`  SKIP ${task.name} - window not found`);
                continue;
            }

            console.log('');
            console.log(`--- Sending to ${task.name} ---`);

            try {
                const jsonContent = fs.readFileSync(task.promptFile, 'utf8');
                const promptObj = JSON.parse(jsonContent);
                const promptText = promptObj['提示词内容'] || '';

                if (!promptText) {
                    console.log('  No prompt content, skipping');
                    continue;
                }

                const tempPromptFile = path.join(os.tmpdir(), 'prompt_' + Date.now() + '.txt');
                fs.writeFileSync(tempPromptFile, promptText, 'utf8');

                const ok = sendPrompt(handle, tempPromptFile, task.name);
                console.log(ok ? '  ✓ Sent OK' : '  ✗ Send may have failed');

                try { fs.unlinkSync(tempPromptFile); } catch (e) {}
            } catch (e) {
                console.log('  ERROR:', e.message);
            }

            console.log('  Waiting 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('');
        console.log(`Waiting ${WAIT_SECONDS} seconds for AI responses...`);
        for (let s = WAIT_SECONDS; s > 0; s--) {
            if (s % 5 === 0 || s <= 3) {
                process.stdout.write(`\r  Remaining: ${s}s `);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');

        console.log('');
        console.log('Closing windows and moving json files...');
        for (const task of batch) {
            const handle = handleMap[task.name];
            if (handle) {
                closeWindow(handle);
                console.log(`  Closed: ${task.name}`);
            }

            const src = task.promptFile;
            const dst = path.join(task.path, path.basename(src));
            try {
                if (fs.existsSync(src)) {
                    fs.renameSync(src, dst);
                    console.log(`  Moved: ${path.basename(src)} -> ${task.name}/`);
                }
            } catch (e) {
                console.log(`  Move failed: ${e.message}`);
            }
        }

        if (b < batches.length - 1) {
            console.log('Waiting 3 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Switch focus back to console window to prevent interference
            console.log('Resetting focus to console...');
            const resetFocusScript = `
${ADD_TYPE_BLOCK}
$consoleTitle = "node"
$found = [System.Collections.ArrayList]::new()

$enumProc = [Win32+EnumWindowsProc]{
    param($hWnd, $lParam)
    if ([Win32]::IsWindowVisible($hWnd)) {
        $tb = New-Object System.Text.StringBuilder(256)
        [Win32]::GetWindowText($hWnd, $tb, $tb.Capacity) | Out-Null
        $title = $tb.ToString()
        if ($title -like "*node*" -or $title -like "*cmd*" -or $title -like "*powershell*") {
            $found.Add($hWnd) | Out-Null
        }
    }
    return $true
}
[Win32]::EnumWindows($enumProc, [IntPtr]::Zero) | Out-Null

if ($found.Count -gt 0) {
    [Win32]::SetForegroundWindow($found[0]) | Out-Null
    Write-Host "Focus reset to console"
} else {
    Write-Host "Console window not found"
}
`.trim();
            try {
                runPS(resetFocusScript);
            } catch (e) {
                // Ignore focus reset errors
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log('');
    console.log('=====================================');
    console.log('  ALL PROMPTS SENT AND FILES MOVED!');
    console.log('=====================================');
    question('Press Enter to exit...').then(() => rl.close());
}

main().catch(err => {
    console.error('ERROR:', err);
    rl.close();
    process.exit(1);
});
