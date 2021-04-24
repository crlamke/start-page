/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
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
            "weatherPreferences": [
                {
                    "locationName": "Home",
                    "lat": "38.84",
                    "lon": "-77.429",
                    "unit": "metric"
                },
                {
                    "locationName": "Work",
                    "lat": "38.84",
                    "lon": "-77.429",
                    "unit": "metric"
                }
            ],
            "toolboxes": [
                {
                    "name": "Etc",
                    "color": "Gray",
                    "visibility": "Hidden"
                },
                {
                    "name": "Timer",
                    "color": "MidnightBlue",
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
                    "name": "Social",
                    "parent": "None",
                    "order": "2",
                    "color": "Red",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "Twitter",
                            "link": "https://twitter.com/"
                        },
                        {
                            "name": "imgur",
                            "link": "https://imgur.com/"
                        },
                        {
                            "name": "reddit",
                            "link": "https://www.reddit.com/"
                        }
                    ]
                },
                {
                    "name": "Tech News",
                    "parent": "None",
                    "order": "3",
                    "color": "Orchid",
                    "visibility": "Shown",
                    "links": [
                        {
                            "name": "Lobsters",
                            "link": "https://lobste.rs/"
                        },
                        {
                            "name": "Hacker News",
                            "link": "https://news.ycombinator.com/"
                        },
                        {
                            "name": "TechDirt",
                            "link": "https://www.techdirt.com/"
                        },
                        {
                            "name": "MIT Tech Review",
                            "link": "https://www.technologyreview.com/"
                        },
                                        {
                            "name": "Ars Technica",
                            "link": "http://arstechnica.com/"
                        },
                        {
                            "name": "OpenSource.com",
                            "link": "https://opensource.com/"
                        }
                    ]
                },
                {
                    "name": "Dev",
                    "parent": "None",
                    "order": "4",
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
                    "order": "5",
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
                }
            ]
        };
