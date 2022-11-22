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
    }
]

export {RouteList};