# Complete Windows Deployment Guide for Fly.io

This step-by-step guide is specifically written for **Windows 10 / 11** using **PowerShell**.

---

## 1. Install Flyctl on Windows

Open **PowerShell** as an administrator or normal user and run:

```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

> **Note**: If you are using standard Windows PowerShell 5.1 (the default blue console), run this command instead:
> ```powershell
> iwr https://fly.io/install.ps1 -useb | iex
> ```

After the installation finishes, close and reopen your PowerShell window, or refresh your environment variables so the `fly` command is recognized:

```powershell
$env:Path += ";$env:USERPROFILE\.fly\bin"
```

Verify that Flyctl is installed:
```powershell
fly version
```

---

## 2. Log in to Fly.io

Run this in PowerShell:
```powershell
fly auth login
```
A browser window will open automatically. Sign in or sign up, and return to PowerShell.

---

## 3. Navigate to Your Project Directory

In PowerShell, change directory to where your project folder is located:

```powershell
cd C:\path\to\your\project-folder
```
*(Example: `cd C:\Users\halvs\projects\b2b-lead-pipeline`)*

---

## 4. Verify Project Files Exist

Ensure `fly.toml` and `Dockerfile` are in your root folder. You can verify in PowerShell:

```powershell
Get-ChildItem fly.toml, Dockerfile
```

---

## 5. Create the Persistent Volume for SQLite (Run Once)

Fly.io creates lightweight Linux microVMs. To keep your SQLite database (`dev.db`) safe when the machine restarts, create a 1GB persistent volume:

```powershell
fly volumes create sqlite_data --size 1 --region ord
```
*(You can change `ord` [Chicago] to `iad` [Virginia] or `sjc` [San Jose] if preferred).*

---

## 6. (Optional) Set Secrets in PowerShell

If you have secrets or keys, set them using `fly secrets`:

```powershell
fly secrets set JWT_SECRET="your-super-secret-jwt-key-2026"
```

---

## 7. Deploy the App

Run the deployment command:

```powershell
fly deploy
```

> **Docker Desktop is NOT required**: Fly.io will automatically upload the files and build the container on their remote cloud builder. You do not need to install or run Docker on Windows.

---

## 8. Open Your Live App

Once the deployment finishes:

```powershell
fly open
```

---

## Useful Windows PowerShell Commands for Managing Fly

- **View Live Logs:**
  ```powershell
  fly logs
  ```
- **Check App & Machine Status:**
  ```powershell
  fly status
  ```
- **SSH into the Container (Interactive Shell):**
  ```powershell
  fly ssh console
  ```
- **Download / Backup SQLite Database to Windows:**
  ```powershell
  fly sftp get /data/dev.db .\backup-dev.db
  ```
- **Restart App:**
  ```powershell
  fly apps restart
  ```
