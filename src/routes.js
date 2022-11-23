import {fetchStatus} from "./subscribe";
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
        path: '/',
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
    }
]

export {RouteList};