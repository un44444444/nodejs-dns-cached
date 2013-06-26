var net = require("net");

function lookup(server, msg, dnsPort, dnsHost, port, address) { // tcp
    this.server = server;
    this._buf = msg;
    this.port = port;
    this.address = address;
    this._client = new net.Socket({
        fd: null, type: null, allowHalfOpen: true
    });
    this._client.once("connect", this.onConnect.bind(this));
    this._client.on("data", this.onData.bind(this));
    this._client.once("end", this.onEnd.bind(this));
    this._client.on("error", this.onError.bind(this));
    this._client.once("close", this.onClose.bind(this));
    this._client.connect(dnsPort, dnsHost);
}

lookup.prototype = {
    onConnect: function () {
        var oldBuf = this._buf;
        var length = oldBuf.length + 2;
        var buf = new Buffer(length);
        buf.writeUInt16BE(oldBuf.length, 0);
        oldBuf.copy(buf, 2, 0);
        delete this._buf;
        this._client.write(buf);
    },
    onData: function (buf) {
        var len = buf.length - 2;
        var newBuf = new Buffer(len);
        buf.copy(newBuf, 0, 2);
        this.server.send(newBuf, 0, len, this.port, this.address);
        this._client.end();
    },
    onError: function () {
        this._client.end();
    },
    onEnd: function () {
        this._client.destroy();
    },
    onClose: function () {
        this.unload();
    },
    unload: function () {
        this._client.removeAllListeners();
        delete this._client;
        delete this.port;
        delete this.address;
        delete this.server;
    }
};

exports.lookup = lookup;
