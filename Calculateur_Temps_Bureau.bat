@echo off
rem ============================================================
rem  PhysiPro - Calculateur de temps  (lanceur de bureau)
rem  ------------------------------------------------------------
rem  Ouvre PhysiPro_Calculateur_Temps.html en mode APPLICATION :
rem  une fenetre propre, sans barre d'adresse et sans onglets.
rem
rem  Internet est requis pour se connecter et pour les temps
rem  partages (Firebase). Sans Internet, la page s'ouvre quand
rem  meme en lecture seule avec les temps de la derniere
rem  synchronisation faite sur ce poste.
rem
rem  A FAIRE UNE SEULE FOIS :
rem    1. Mettre ce .bat et PhysiPro_Calculateur_Temps.html dans
rem       le MEME dossier (par exemple C:\PhysiPro\Calculateur\).
rem    2. Clic droit sur ce .bat -> Envoyer vers -> Bureau
rem       (creer un raccourci). Le raccourci devient l'icone.
rem    3. Facultatif : clic droit sur le raccourci -> Proprietes
rem       -> Changer d'icone.
rem
rem  SI LA CONNEXION AFFICHE "La cle Firebase refuse les
rem  ouvertures faites hors du site" : mettre l'adresse du
rem  fichier sur le site a la ligne SITE_URL ci-dessous. Le .bat
rem  ouvrira alors la version du site au lieu du fichier local.
rem ============================================================

setlocal
set "SITE_URL="

rem --- Edge (installe par defaut sur Windows) ---
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

rem --- Chrome, si jamais Edge n'est pas la ---
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if not "%SITE_URL%"=="" (
  set "CIBLE=%SITE_URL%"
  goto :lancer
)

set "PAGE=%~dp0PhysiPro_Calculateur_Temps.html"
if not exist "%PAGE%" (
  echo.
  echo   Fichier introuvable :
  echo   %PAGE%
  echo.
  echo   Le .bat et le fichier .html doivent etre dans le meme dossier.
  echo.
  pause
  exit /b 1
)
set "CIBLE=file:///%PAGE:\=/%"

:lancer
if exist "%EDGE%" (
  start "" "%EDGE%" --app="%CIBLE%" --window-size=1200,900
  exit /b 0
)
if exist "%CHROME%" (
  start "" "%CHROME%" --app="%CIBLE%" --window-size=1200,900
  exit /b 0
)

rem --- Dernier recours : ouverture normale dans le navigateur ---
if not "%SITE_URL%"=="" (start "" "%SITE_URL%") else (start "" "%PAGE%")
exit /b 0
