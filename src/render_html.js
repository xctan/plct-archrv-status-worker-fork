const generateHTML = (pkgs, durations) => {
    const duration_list = Object.entries(durations)
        .map(([name, duration]) => {
            return `<span class="subreqtime"> -> Request to ${name} took ${duration}ms</span><br/>`;
        })
        .join('');
    const package_list = renderPackages(Object.values(pkgs));

    return `<!DOCTYPE html>
<html>
    <head>
        <title>ArchRV PKG Status</title>
        <meta charset="utf-8">
        <style>
        body {
          margin: 0;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          line-height: 1.5;
          font-family: Consolas, Ubuntu Mono, Menlo, monospace;
        }
        a {
          text-decoration: none;
        }
        th,
        td {
          text-align: left;
          vertical-align: top;
          padding: 0.3rem;
          border-top: 1px solid;
        }
        tr.package-comment {
          display: none;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        span.pkgtag {
          font-size: 0.8em;
        }
        span.pkgtag-leaf {
          color: #fff;
          background-color: #555;
        }
        span.pkgtag-rotten {
          color: lightyellow;
          background-color: darkred;
        }
        span.pkgtag-rotten:hover {
          color: darkred;
          background-color: lightyellow;
        }
        span.pkgtag-patched {
          color: lightgreen;
          background-color: slateblue;
        }
        span.pkgtag-patched:hover {
          color: slateblue;
          background-color: lightgreen;
        }
        span.subreqtime {
          font-size: 0.8em;
        }
        span.lonely-package {
          font-style: italic;
          color: rgba(0, 0, 0, 0.05);
        }
        tr.expand {
          font-size: 0.8em;
        }
        td.expand {
          border-top-style: dashed;
        }
        td.expand-pre {
          border-top-style: dotted;
          padding-left: 2%;
        }
        @media (prefers-color-scheme: light) {
          body,
          .table {
            color: #333;
            background-color: #eee;
          }
          a {
            color: royalblue;
          }
          a:hover {
            color: blueviolet;
          }
          th,
          td {
            border-top-color: #888;
          }
          tr.pkgwork-add {
            background-color: lightpink;
          }
          tr.pkgwork-pr,
          tr.pkgwork-prrm,
          tr.pkgmark-upstreamed {
            background-color: lightblue;
          }
          tr.pkgmark-ready,
          tr.pkgmark-pending,
          tr.pkgmark-noqemu {
            background-color: lightgreen;
          }
          tr.pkgmark-failing {
          }
          tr.pkgmark-outdated,
          tr.pkgmark-outdated_dep,
          tr.pkgmark-missing_dep,
          tr.pkgmark-ignore,
          tr.pkgmark-stuck {
            background-color: lightgray;
          }
          tr.pkgmark-unknown {
            background-color: khaki;
          }
          tr.pkgmark-nocheck {
            background-color: lightgoldenrodyellow;
          }
          tr.pkgmark-flaky {
            background-color: lightsteelblue;
          }
          span.pkgmark-noqemu {
            background-color: gold;
          }
        }
        @media (prefers-color-scheme: dark) {
          body,
          .table {
            color: white;
            background-color: #333;
          }
          a {
            color: cyan;
          }
          a:hover {
            color: gold;
          }
          th,
          td {
            border-top-color: white;
          }
          tr.pkgwork-add {
            background-color: mediumvioletred;
          }
          tr.pkgwork-pr,
          tr.pkgwork-prrm,
          tr.pkgmark-upstreamed {
            background-color: blueviolet;
          }
          tr.pkgmark-ready,
          tr.pkgmark-pending,
          tr.pkgmark-noqemu {
            background-color: olivedrab;
          }
          tr.pkgmark-failing {
          }
          tr.pkgmark-outdated,
          tr.pkgmark-outdated_dep,
          tr.pkgmark-missing_dep,
          tr.pkgmark-ignore,
          tr.pkgmark-stuck {
            background-color: gray;
          }
          tr.pkgmark-unknown {
            background-color: chocolate;
          }
          tr.pkgmark-nocheck {
            background-color: darkgoldenrod;
          }
          tr.pkgmark-flaky {
            background-color: darkcyan;
          }
          span.pkgmark-noqemu {
            background-color: red;
          }
        }
        body {
          width: 80%;
        }
        @media (max-aspect-ratio: 1/1) {
          body {
            width: 100%;
          }
        }
        @media (min-aspect-ratio: 16/9) {
          body {
            width: 62%;
          }
        }
        </style>
    </head>
    <body>
        ${duration_list}
        <table>
            <thead>
                <tr>
                    <th scope="col">name</th>
                    <th scope="col">user</th>
                    <!-- <th scope="col">work</th> -->
                    <th scope="col">mark</th>
                </tr>
            </thead>
            <tbody>
            ${package_list}
            </tbody>
        </table>
    </body>
</html>
    `;
}

export default generateHTML;

const renderPackages = (pkgs) => {
    pkgs = pkgs.filter(pkg => {
        if (pkg.felix !== 'dir' && !pkg.work.kind && !pkg.user) {
            return false;
        }
        // todo: apply search filter
        return true;
    })

    // todo: apply sort filter

    const tabs = [
        renderTabName,
        (pkg) => pkg.user || `<span class="lonely-package">nobody</span>`,
        // renderTabWork,
        renderTabMark,
    ]

    return pkgs
        .map(pkg => {
            const tr_class = [
                (() => {
                    if (pkg.work.kind) {
                        return `pkgwork-${pkg.work.kind}`;
                    } else {
                        return ''
                    }
                })(),
                ...pkg.mark.map(m => {
                    if (typeof m === 'string') {
                        return `pkgmark-${m}`;
                    }
                    return `pkgmark-${m.name}`;
                }),
                (() => {
                    if (pkg.user) {
                        return `user-${pkg.user}`
                    } else {
                        return 'nobody'
                    }
                })()
            ]
                .join(' ');
            const tab_list = tabs.map(tab => `<td>${tab(pkg)}</td>`).join('');
            const comment = pkg.mark
                .filter(m => typeof m === 'object')
                .map(m => `
<tr class="${tr_class} package-comment expand">
    <td class="expand-pre">--> ${m.name}</td>
    <td class="expand" colspan="3">
        ${m.comment.replaceAll('\<', '&lt;').replaceAll('\>', '&gt;')}
    </td>
</tr>
                `)
                .join('');

            return `
<tr class="${tr_class}">
    ${tab_list}
</tr>
${comment}
            `;
        })
        .join('');
}

const wrapExternalLink = (url, inner) => `<a href="${url}" target="_blank">${inner}</a>`;

const renderTabName = (pkg) => {
    let name = pkg.name;
    if (pkg.felix === 'dir') {
        name = wrapExternalLink(`https://archriscv.felixc.at/.status/logs/${pkg.base || pkg.name}/`, name);
    } else if (pkg.work.kind === 'prrm') {
        name = `<del>${name}</del>`;
    }

    let tags =
        [
            {
                tag: 'leaf',
                condition: pkg.felix === 'leaf',
            },
            {
                tag: 'rotten',
                condition: pkg.mark.find(mark => mark === 'triage-patch-failed'),
                url: `https://github.com/felixonmars/archriscv-packages/tree/master/${pkg.name}`,
            },
            {
                tag: 'patched',
                condition: pkg.mark.find(mark => mark === 'patched'),
                url: `https://github.com/felixonmars/archriscv-packages/tree/master/${pkg.name}`,
            }
        ]
            .filter(tag => tag.condition)
            .map(tag => {
                let tag_html = `<span class="pkgtag pkgtag-${tag.tag}">[${tag.tag}]</span>`;
                if (tag.url) {
                    tag_html = wrapExternalLink(tag.url, tag_html);
                }
                return tag_html;
            })
            .join(' ');

    let arch_link = wrapExternalLink(`https://archlinux.org/packages/?q=${pkg.base || pkg.name}`, '[A]');

    return `${arch_link} | ${name} ${tags}`;
}

const renderTabWork = (pkg) => {
    const str_work = {
        'add': 'working',
        'pr': 'pull requested',
        'prrm': 'rm requested',
    }
    let result = str_work[pkg.work.kind] || '';
    if (pkg.work.pr) {
        result = wrapExternalLink(pkg.work.pr, result);
    }
    return result;
}

const renderTabMark = (pkg) => {
    const str_mark = {
        'unknown': 'unknown',
        'upstreamed': 'upstreamed',
        'outdated': 'outdated',
        'outdated_dep': 'dep outdated',
        'stuck': 'stuck',
        'noqemu': 'noqemu',
        'ready': 'ready',
        'pending': 'pending',
        'ignore': 'ignore',
        'missing_dep': 'dep missing',
        'failing': 'failing',
        'flaky': 'flaky',
        'nocheck': 'no check',
    }

    return pkg.mark
        .map(m => {
            // marks from felix
            if (typeof m === 'string') {
                return `<span class="pkgmark pkgmark-${m}">${m.replace('triage-', '')}</span>`;
            }

            // marks from melon
            let result = str_mark[m.name] || '';
            let link = m.comment.match(/https?:\/\/[^\s]+/g);
            if (link) {
                result = wrapExternalLink(link[0], result);
            }
            let title = `marked-by: ${m.by.alias}`;
            if (m.comment) {
                result += '*';
                title += '\n...' + m.comment.replaceAll(`"`, `'`);
            }

            return `<span class="pkgmark pkgmark-${m.name}" title="${title}">${result}</span>`;
        })
        .join(', ');
}