{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.atk
    pkgs.at-spi2-atk
    pkgs.cups
    pkgs.libdrm
    pkgs.gtk3
    pkgs.libxcomposite
    pkgs.libxdamage
    pkgs.libxrandr
    pkgs.gbm
    pkgs.libxscrnsaver
    pkgs.alsa-lib
    pkgs.pango
    pkgs.cairo
    pkgs.gdk-pixbuf
    pkgs.fontconfig
    pkgs.freetype
    pkgs.dbus
    pkgs.expat
  ];
}
