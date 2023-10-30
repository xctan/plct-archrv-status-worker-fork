import {fetchStatus, fetchRawStatus} from "./subscribe";
import generateHTML from "./render_html";
import renderPlain from "./render_plain";

const RouteList = [
    {
        path: '/robots.txt',
        handler: async (request, env, ctx) => {
            return new Response('User-agent: *\nDisallow: /', {
                headers: {'Content-Type': 'text/plain'},
            });
        }
    },
    {
        path: '/favicon.ico',
        handler: async (request, env, ctx) => {
            return new Response('', {
                status: 302,
                headers: {
                    'Location': 'https://riscv-notes.sh1mar.in/img/favicon.ico',
                }
            })
        }
    },
    {
        path: '/static',
        handler: async (request, env, ctx) => {
            try {
                const {pkgs, durations} = await fetchStatus();

                // check query string
                const url = new URL(request.url);
                let format = url.searchParams.get('f');
                if (!format) {
                    // check ua
                    const ua = request.headers.get('User-Agent');
                    if (ua && ua.includes('Mozilla')) {
                        format = 'html';
                    } else {
                        format = 'plain';
                    }
                }

                switch (format) {
                    case 'plain':
                        return new Response(renderPlain(pkgs, durations), {
                            headers: {'Content-Type': 'text/plain'},
                        });
                    case 'json':
                        return new Response(JSON.stringify(pkgs), {
                            headers: {'Content-Type': 'application/json'},
                        });
                    default:
                    case 'html':
                        return new Response(generateHTML(pkgs, durations), {
                            headers: {'Content-Type': 'text/html'},
                        });
                }

            } catch (e) {
                return new Response(e.message, {
                    status: 500,
                });
            }
        }
    },
    {
        path: '/raw',
        handler: async (request, env, ctx) => {
            const allowed_host = /127\.0\.0\.1|archrv/g;
            let cors_headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET'
            };

            // intercept OPTION
            if (request.method === 'OPTION') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        ...cors_headers
                    }
                })
            }
            try {
                const raw_source = await fetchRawStatus();
                return new Response(JSON.stringify(raw_source), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...cors_headers
                    },
                });
            } catch (e) {
                return new Response(e.message, {
                    status: 500,
                });
            }
        }
    },
    {
        path: '/',
        handler: async (request, env, ctx) => {
            const ua = request.headers.get('User-Agent');
            if (ua && ua.includes('Mozilla')) {
                // leave rendering job to the client
                return new Response('Moved', {
                    status: 302,
                    headers: {
                        // 'Location': 'https://archrv-dash.pages.dev/'
                        'Location': '/static',
                    }
                });
            } else {
                return new Response('', {
                    status: 302,
                    headers: {
                        'Location': '/static',
                    }
                })
            }
        }
    }
]

export {RouteList};