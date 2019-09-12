# React Big Calendar Timezone Gutter

[**LIVE**](https://tomashubelbauer.github.io/rbc-timezone-gutter)

![](https://github.com/tomashubelbauer/rbc-timezone-gutter/workflows/github-pages/badge.svg)

![](screenshot.png)

This repository demonstrates adding time zone conversion columns into the gutter
of the React Big Calendar component.

The `timeGutterHeader` and `timeSlotWrapper` components (the `components` prop)
are is used to enable this. With `timeSlotWrapper`, `props.resource` can be
either `undefined` or `null`. `undefined` identifies a slot belonging to the
calendar gutter, `null` or any other value identifies a slot belonging to the
calendar time grid. We add the `rbc-time-header-gutter` class name to our own
custom gutter header so that the automatic stretching to match the gutter width
is carried out by RBC as with the default calendar gutter header.
