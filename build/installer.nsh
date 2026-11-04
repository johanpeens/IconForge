; Extra steps for the Icon Forge installer.
; The image engine needs the Microsoft Visual C++ 2015-2022 runtime (x64). Many fresh Windows PCs do not have it.
; If it is missing or too old, we install Microsoft's own runtime installer. Windows asks once for permission.

!macro customInstall
  SetRegView 64
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ReadRegDWORD $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Minor"
  ${If} $0 != 1
  ${OrIf} $1 < 29
    DetailPrint "Adding the Microsoft Visual C++ runtime (the image engine needs it)..."
    SetOutPath "$PLUGINSDIR"
    File "/oname=$PLUGINSDIR\vc_redist.x64.exe" "${BUILD_RESOURCES_DIR}\prereq\vc_redist.x64.exe"
    ExecShellWait "open" "$PLUGINSDIR\vc_redist.x64.exe" "/install /quiet /norestart"
    Delete "$PLUGINSDIR\vc_redist.x64.exe"
    ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
    ReadRegDWORD $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Minor"
    ${If} $0 != 1
    ${OrIf} $1 < 29
      MessageBox MB_OK|MB_ICONEXCLAMATION "Icon Forge is installed, but the Microsoft Visual C++ runtime could not be added (it needs your permission).$\r$\n$\r$\nIcon Forge cannot make icons without it. Run this installer again and choose Yes when Windows asks, or get it free from https://aka.ms/vs/17/release/vc_redist.x64.exe" /SD IDOK
    ${EndIf}
  ${EndIf}
!macroend
