const renderPlain = (pkgs, durations) => {
    // assuming column width is 120
    let lines = [];

    // duration info
    lines.push(
        ...Object.entries(durations)
            .map(([name, duration]) => `-> Request to ${name} took ${duration}ms`),
        '------------------------------------------------------------',
    );

    // table header
    lines.push(
        `${'name'.padEnd(50)}${'user'.padEnd(10)}${'work'.padEnd(10)}${'mark'.padEnd(50)}`
    );

    let line_cnt = 0

    // table body
    for (let pkg of Object.values(pkgs).filter(pkg => {
        if (pkg.felix !== 'dir' && !pkg.work.kind && !pkg.user) {
            return false;
        }
        // todo: apply search filter
        return true;
    }))
    {
        line_cnt += 1;
        if (line_cnt > 200) {
            break;
        }

        lines.push(
            `${pkg.name.padEnd(50)}${(pkg.user || '').padEnd(10)}${pkg.work.kind.padEnd(10)}${pkg.mark.map(textMark).join(', ').padEnd(50)}`
        );
    }

    lines.push(''); // add a newline at the end

    return lines.join('\r\n');
}

const textMark = (mark) => mark.name || mark;

export default renderPlain;