# migrate.ps1
# 用途：把 Voice-Generator 项目从现有结构迁移到 supervisor 要求的目录结构。
# 只负责搭"空壳"和能安全自动搬动的文件；涉及代码拆分的部分会打印提示，需要你手动完成。
#
# 使用方法：
#   1. 先 git commit 一次现有代码（万一出错方便回滚）
#   2. 在项目根目录（D:. 那一层，也就是 backend/ 和 frontend/ 的上一级）打开 PowerShell
#   3. 执行: powershell -ExecutionPolicy Bypass -File migrate.ps1

$ErrorActionPreference = "Stop"

Write-Host "== 1. 创建顶层目录 (models/ datasets/ docs/) ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "models\TTS"      | Out-Null
New-Item -ItemType Directory -Force -Path "models\Vocoder"  | Out-Null
New-Item -ItemType Directory -Force -Path "models\Speaker"  | Out-Null
New-Item -ItemType Directory -Force -Path "datasets"        | Out-Null
New-Item -ItemType Directory -Force -Path "docs"            | Out-Null

Write-Host "== 2. 把误放在根目录的前端文件挪回 frontend/ ==" -ForegroundColor Cyan
foreach ($f in @("index.html", "package-lock.json", "eslint.config.js")) {
    if (Test-Path $f) {
        Move-Item -Force $f "frontend\$f"
        Write-Host "  moved $f -> frontend\$f"
    }
}

Write-Host "== 3. frontend: 新建 pages/ 和 services/ ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "frontend\src\pages"    | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\services" | Out-Null
if (-not (Test-Path "frontend\src\services\api.js")) {
    New-Item -ItemType File -Force -Path "frontend\src\services\api.js" | Out-Null
}

Write-Host "== 4. frontend: data/ 下的文件先搬进 services/，你再决定怎么归类 ==" -ForegroundColor Cyan
if (Test-Path "frontend\src\data") {
    Move-Item -Force "frontend\src\data\*" "frontend\src\services\"
    Remove-Item -Force -Recurse "frontend\src\data"
}

Write-Host "== 5. backend: 新建 models/ inference/ api/ utils/ ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "backend\models"    | Out-Null
New-Item -ItemType Directory -Force -Path "backend\inference" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\api"       | Out-Null
New-Item -ItemType Directory -Force -Path "backend\utils"     | Out-Null
New-Item -ItemType Directory -Force -Path "backend\temp"      | Out-Null

Write-Host "== 6. backend: output/ -> outputs/generated_audio/ ==" -ForegroundColor Cyan
if (Test-Path "backend\output") {
    New-Item -ItemType Directory -Force -Path "backend\outputs\generated_audio" | Out-Null
    Move-Item -Force "backend\output\*" "backend\outputs\generated_audio\"
    Remove-Item -Force -Recurse "backend\output"
}

Write-Host "== 7. backend: tts_engine.py 复制到新位置占位（原文件先不删）==" -ForegroundColor Cyan
if (Test-Path "backend\tts_engine.py") {
    Copy-Item -Force "backend\tts_engine.py" "backend\models\voice_model.py"
    Copy-Item -Force "backend\tts_engine.py" "backend\inference\generate_voice.py"
}
New-Item -ItemType File -Force -Path "backend\models\loader.py"        | Out-Null
New-Item -ItemType File -Force -Path "backend\inference\preprocess.py" | Out-Null
New-Item -ItemType File -Force -Path "backend\api\routes.py"           | Out-Null
New-Item -ItemType File -Force -Path "backend\utils\audio.py"          | Out-Null
New-Item -ItemType File -Force -Path "backend\utils\file.py"           | Out-Null

Write-Host ""
Write-Host "== 空壳结构搭建完成 ==" -ForegroundColor Green
Write-Host ""
Write-Host "以下几件事脚本没法自动做，需要你手动处理：" -ForegroundColor Yellow
Write-Host "1. backend/tts_engine.py 已经复制到 models/voice_model.py 和 inference/generate_voice.py"
Write-Host "   两份内容目前完全一样，需要你手动删减：voice_model.py 只留模型加载相关代码，"
Write-Host "   generate_voice.py 只留推理/生成逻辑代码。原 tts_engine.py 确认拆完后可以删除。"
Write-Host "2. backend/app.py 里的路由定义需要手动搬到 api/routes.py，app.py 只保留启动逻辑。"
Write-Host "3. frontend 组件命名对不上：现有 Header/Footer/Main/SpeechControls/VoiceControls/VoicePresets"
Write-Host "   需要按 Sidebar/VoiceCard/PromptBox/AudioPlayer/SettingsPanel + pages(Home/History/Settings)"
Write-Host "   重新拆分组件粒度，这个脚本无法自动完成。"
Write-Host "4. backend/voices/ 里的音色 wav 文件，目标结构没有明确位置（可能该放顶层 models/Speaker/），"
Write-Host "   建议先跟 supervisor 确认。"
Write-Host "5. requirements.txt 需要手动生成，激活 venv 后执行："
Write-Host "   cd backend; .\venv\Scripts\activate; pip freeze > requirements.txt"
