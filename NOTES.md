iTerm2 - Wide emoji appears to be considered one column wide
https://gitlab.com/gnachman/iterm2/issues/5323 This is fixed in the nightly
build when you enable Unicode version 9 (which you can do from profile prefs),
but it will break all kinds of apps that assume the unicode v8 width tables are
still in use.
