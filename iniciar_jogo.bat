@echo off
echo Tentando iniciar o jogo...

:: Tenta com Python primeiro (comum no Windows)
where python >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando com Python...
    python server.py
    goto end
)

:: Tenta com npx (Node.js)
where npx >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando com Node.js (npx)...
    npx serve .
    goto end
)

echo Erro: Voce precisa ter Python ou Node.js instalado para rodar o jogo 3D devido a restricoes do navegador.
pause

:end
