@echo off
chcp 65001 >nul
setlocal
set "REPO=E:\deepseek\linklist-studio"

if not exist "%REPO%\data\tree.json" (
  echo 找不到知识库：%REPO%\data\tree.json
  echo 请编辑本文件，把 REPO 改成你的仓库路径。
  pause
  exit /b 1
)

node "%REPO%\tools\rag.js" --root="%REPO%" %*
echo.
pause
