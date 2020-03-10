/* 
 * The MIT License
 *
 * Copyright 2020 Chris Lamke <https://chris.lamke.org>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
:root[theme='dark'] {
    --color-background: #404040;
    --color-primary: #0060df;
    --color-secondary: #fbfbfe;
    --color-accent: #fd6f53;
    --color-font: #000000;
    --color-link: #fcf9ff;
    --color-link-hover: blue;
}

:root[theme='light'] {
    --color-background: #404040;
    --color-primary: #17ed90;
    --color-secondary: #2a2c2d;
    --color-accent: #12cdea;
    --color-font: #ffffff;
    --color-link: #ffffff;
    --color-link-hover: blue;
}

:root[theme='colorfulA'] {
    --color-background: #404040;
    --color-primary: #17ed90;
    --color-secondary: #2a2c2d;
    --color-accent: #12cdea;
    --color-font: #ffffff;
    --color-link: #ffffff;
    --color-link-hover: blue;
}

*/

function themeOptionSelect(selectedValue) {
    if (selectedValue === "optDark") {
        setTheme("theme-dark");
    } else if (selectedValue === "optLight") {
        setTheme("theme-light");
    } else if (selectedValue === "optColorfulA") {
        setTheme("theme-colorful-a");
    } else {
        console.log("Invalid Theme Selection");
    }
}

// function to set a given theme/color-scheme
function setTheme(themeName) {
    //localStorage.setItem('theme', themeName);
    document.documentElement.setAttribute('theme', themeName);
    //document.documentElement.setAttribute()
}

