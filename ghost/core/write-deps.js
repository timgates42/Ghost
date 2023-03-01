module.exports = function patch(timeout = 5000) {
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    const requiredBy = {};
    const requires = {};

    function set(obj, parts, path) {
        const [first, ...rest] = parts;
        if (first === undefined) {
            obj.push(path);
            return;
        }
        if (!obj[first]) {
            if (rest.length === 0) {
                obj[first] = [];
            } else {
                obj[first] = {};
            }
        }
        set(obj[first], rest, path);
        return;
    }

    Module.prototype.require = function (name, ...args) {
        const parent = this.filename;
        const child = Module._resolveFilename(name, this, false);

        set(requiredBy, child.split('/'), parent);
        set(requires, parent.split('/'), child);

        return originalRequire.call(this, name, ...args);
    };

    setTimeout(function () {
        require('fs').writeFileSync('requiredBy.json', JSON.stringify(requiredBy));
        require('fs').writeFileSync('requires.json', JSON.stringify(requires));
        console.log('wrote files');
    }, timeout);
}
