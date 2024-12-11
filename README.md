# Currency rates

This is a solution to the test assignment to implement an editable list of currency rates received from an API.

## Implementation notes

I used Vite for the initial project scaffolding, and as a bundler and a development server. Other than that, only React was used without any third-party libraries. As such, API calls are done with `fetch()`, styling is pure CSS, state management is done just with `useState()`.
As the styles are minimal, I decided to just put them all in one `globals.css` file. Normally, my preference is to go for CSS modules.
