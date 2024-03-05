# Changelog

## 1.1.2

### Added

- receive methods now check for `event.source === iframe.contentWindow` if an iframe is passed.
- receive methods have a new `options` parameter that allows to change the behaviour (`iframeEmitterCheck`) to additionally check if `event.origin` matches `iframe.src`.

## 1.1.1

### Fixed

- send methods were accessing iframe window's location although host window location shall be accessed.

## 1.1.0

### Changed

- send* and receive* methods do not accept a window object anymore
- send* and receive* methods auto resolve the targetOrigin now via `iframe.getAttribute("src")`

## 1.0.1

Initial release:

- Server functions to generate helper page/iframe HTML.
- Client functions to set head + body content, and to receive dimension updates.
