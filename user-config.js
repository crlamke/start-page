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
 * Note that you can choose colors for a link group from the page 
 * https://www.w3schools.com/colors/colors_names.asp.
 */

var userConfig =
        {
            "searchProviders": [
                {
                    "name": "DuckDuckGo",
                    "link": "https://www.duckduckgo.com/"
                },
                {
                    "name": "Google",
                    "link": "https://www.google.com/"
                },
                {
                    "name": "Bing",
                    "link": "https://www.bing.com/"
                }
            ],

            "toolboxes": [
                {
                    "name": "PageSettings",
                    "color": "Gray",
                    "visibility": "Hidden"
                },
                {
                    "name": "Etc",
                    "color": "Gray",
                    "visibility": "Hidden"
                },
                {
                    "name": "ThemeSelector",
                    "color": "Gray",
                    "visibility": "Hidden"
                },
                {
                    "name": "Timer",
                    "color": "MidnightBlue",
                    "visibility": "Shown"
                },
                {
                    "name": "Timer",
                    "color": "DeepSkyBlue",
                    "visibility": "Shown"
                },
                {
                    "name": "TimeAndAlarm",
                    "color": "Gray",
                    "visibility": "Shown"
                }
            ],

            "linkGroups": [
                {
                    "name": "News",
                    "parent": "None",
                    "order": "1",
                    "color": "Crimson",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "Twitter",
                            "link": "https://twitter.com/"
                        },
                        {
                            "name": "Hacker News",
                            "link": "https://news.ycombinator.com/"
                        },
                        {
                            "name": "BBC News",
                            "link": "https://www.bbc.com/news"
                        },
                        {
                            "name": "New York Times",
                            "link": "https://www.nytimes.com/"
                        }
                    ]
                },
                {
                    "name": "Multimedia",
                    "parent": "None",
                    "order": "2",
                    "color": "Orchid",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "Spotify",
                            "link": "https://www.spotify.com/us/"
                        },
                        {
                            "name": "Hulu",
                            "link": "https://www.hulu.com/"
                        },
                        {
                            "name": "Netflix",
                            "link": "https://www.netflix.com"
                        }
                    ]
                },
                {
                    "name": "Podcasts",
                    "parent": "Multimedia",
                    "order": "0",
                    "color": "Orchid",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "PocketCasts",
                            "link": "https://play.pocketcasts.com/web/podcasts"
                        },
                        {
                            "name": "No Sleep",
                            "link": "https://www.thenosleeppodcast.com/"
                        },
                        {
                            "name": "Alice Isn't Dead",
                            "link": "https://www.nightvalepresents.com/aliceisntdead"
                        },
                        {
                            "name": "Mission to Zyxx",
                            "link": "https://www.missiontozyxx.space/"
                        },
                        {
                            "name": "What A Time To Be Alive",
                            "link": "https://soundcloud.com/whatatimepod"
                        }
                    ]
                },
                {
                    "name": "Dev",
                    "parent": "None",
                    "order": "3",
                    "color": "Blue",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "GitHub",
                            "link": "https://github.com/crlamke"
                        },
                        {
                            "name": "CodeChef",
                            "link": "https://www.codechef.com/ide"
                        },
                        {
                            "name": "HTML Style Guide",
                            "link": "https://google.github.io/styleguide/htmlcssguide.html"
                        }
                    ]
                },
                {
                    "name": "Work",
                    "parent": "None",
                    "order": "4",
                    "color": "Green",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "OneDrive",
                            "link": "https://onedrive.live.com/"
                        },
                        {
                            "name": "LinkedIn",
                            "link": "https://www.linkedin.com/"
                        },
                        {
                            "name": "RocketChat",
                            "link": "https://rocket.chat/"
                        }
                    ]
                }
            ],

            "rssFeeds": [
                {
                    "name": "BBC News",
                    "link": "http://feeds.bbci.co.uk/news/world/rss.xml"
                },
                {
                    "name": "NYT",
                    "link": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
                },
                {
                    "name": "The Verge",
                    "link": "http://www.theverge.com/rss/index.xml"
                },
                {
                    "name": "Hacker News",
                    "link": "https://news.ycombinator.com/rss"
                },
                {
                    "name": "Lobsters",
                    "link": "https://lobste.rs/rss"
                },
                {
                    "name": "TechDirt",
                    "link": "https://www.techdirt.com/techdirt_rss.xml"
                },
                {
                    "name": "Tech Review",
                    "link": "https://www.technologyreview.com/feed/"
                },
                                {
                    "name": "Ars Technica",
                    "link": "http://feeds.arstechnica.com/arstechnica/index/"
                },
                {
                    "name": "Open Source",
                    "link": "https://opensource.com/feed"
                }
            ]
        };
