{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.chromium
    pkgs.nss
    pkgs.alsaLib
    pkgs.glib
    pkgs.glibc
    pkgs.cups
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXrandr
    pkgs.xorg.libXcursor
    pkgs.xorg.libXi
    pkgs.xorg.libXext
    pkgs.xorg.libXtst
    pkgs.xorg.libxcb
    pkgs.gtk3
    pkgs.libdrm
    pkgs.freetype
    pkgs.fontconfig
    pkgs.gst_all_1.gstreamer
    pkgs.gst_all_1.gst-plugins-base
  ];
}
