var test = require('tape');
var assign = require('lodash.assign');
var keys = require('lodash.keys');
var size = require('lodash.size');
var debounce = require('lodash.debounce');
var Events = require('../ampersand-events');


test('on and trigger', function (t) {
    t.plan(2);
    var obj = {
        counter: 0
    };
    assign(obj, Events);
    obj.on('event', function () {
        obj.counter += 1;
    });
    obj.trigger('event');
    t.equal(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    t.equal(obj.counter, 5, 'counter should be incremented five times.');
    t.end();
});

test('bind/unbind and trigger (for backwards compatibility)', function (t) {
    t.plan(3);
    var obj = {
        counter: 0
    };
    assign(obj, Events);
    obj.bind('event', function () {
        obj.counter += 1;
    });
    obj.trigger('event');
    t.equal(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    t.equal(obj.counter, 5, 'counter should be incremented five times.');
    obj.unbind('event');
    obj.trigger('event');
    t.equal(obj.counter, 5, 'counter should not be further incremented as unbound.');
    t.end();
});

test('binding and triggering multiple events', function (t) {
    t.plan(4);
    var obj = { counter: 0 };
    assign(obj, Events);

    obj.on('a b c', function () { obj.counter += 1; });

    obj.trigger('a');
    t.equal(obj.counter, 1);

    obj.trigger('a b');
    t.equal(obj.counter, 3);

    obj.trigger('c');
    t.equal(obj.counter, 4);

    obj.off('a c');
    obj.trigger('a b c');
    t.equal(obj.counter, 5);
    t.end();
});

test('binding and triggering with event maps', function (t) {
    var obj = { counter: 0 };
    assign(obj, Events);

    var increment = function () {
        this.counter += 1;
    };

    obj.on({
        a: increment,
        b: increment,
        c: increment
    }, obj);

    obj.trigger('a');
    t.equal(obj.counter, 1);

    obj.trigger('a b');
    t.equal(obj.counter, 3);

    obj.trigger('c');
    t.equal(obj.counter, 4);

    obj.off({
        a: increment,
        c: increment
    }, obj);
    obj.trigger('a b c');
    t.equal(obj.counter, 5);
    t.end();
});

test('listenTo and stopListening', function (t) {
    t.plan(1);
    var a = assign({}, Events);
    var b = assign({}, Events);
    a.listenTo(b, 'all', function () { t.ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'all', function () { t.ok(false); });
    a.stopListening();
    b.trigger('anything');
    t.end();
});

test('listenTo and stopListening with event maps', function (t) {
    t.plan(4);
    var a = assign({}, Events);
    var b = assign({}, Events);
    var cb = function () { t.ok(true); };
    a.listenTo(b, {event: cb});
    b.trigger('event');
    a.listenTo(b, {event2: cb});
    b.on('event2', cb);
    a.stopListening(b, {event2: cb});
    b.trigger('event event2');
    a.stopListening();
    b.trigger('event event2');
    t.end();
});

test('stopListening with omitted args', function (t) {
    t.plan(2);
    var a = assign({}, Events);
    var b = assign({}, Events);
    var cb = function () { t.ok(true); };
    a.listenTo(b, 'event', cb);
    b.on('event', cb);
    a.listenTo(b, 'event2', cb);
    a.stopListening(null, {event: cb});
    b.trigger('event event2');
    b.off();
    a.listenTo(b, 'event event2', cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
    t.end();
});

test('listenToOnce and stopListening', function (t) {
    t.plan(1);
    var a = assign({}, Events);
    var b = assign({}, Events);
    a.listenToOnce(b, 'all', function () { t.ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenToOnce(b, 'all', function () { t.ok(false); });
    a.stopListening();
    b.trigger('anything');
    t.end();
});

test('listenTo, listenToOnce and stopListening', function (t) {
    t.plan(1);
    var a = assign({}, Events);
    var b = assign({}, Events);
    a.listenToOnce(b, 'all', function () { t.ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenTo(b, 'all', function () { t.ok(false); });
    a.stopListening();
    b.trigger('anything');
    t.end();
});

test('listenTo and stopListening with event maps', function (t) {
    t.plan(1);
    var a = assign({}, Events);
    var b = assign({}, Events);
    a.listenTo(b, {change: function () { t.ok(true); }});
    b.trigger('change');
    a.listenTo(b, {change: function () { t.ok(false); }});
    a.stopListening();
    b.trigger('change');
    t.end();
});

test('listenTo yourself', function (t) {
    t.plan(1);
    var e = assign({}, Events);
    e.listenTo(e, 'foo', function () { t.ok(true); });
    e.trigger('foo');
    t.end();
});

test('listenTo yourself cleans yourself up with stopListening', function (t) {
    t.plan(1);
    var e = assign({}, Events);
    e.listenTo(e, 'foo', function () { t.ok(true); });
    e.trigger('foo');
    e.stopListening();
    e.trigger('foo');
    t.end();
});

test('stopListening cleans up references', function (t) {
    t.plan(4);
    var a = assign({}, Events);
    var b = assign({}, Events);
    var fn = function () {};
    a.listenTo(b, 'all', fn).stopListening();
    t.equal(size(a._listeningTo), 0);
    a.listenTo(b, 'all', fn).stopListening(b);
    t.equal(size(a._listeningTo), 0);
    a.listenTo(b, 'all', fn).stopListening(null, 'all');
    t.equal(size(a._listeningTo), 0);
    a.listenTo(b, 'all', fn).stopListening(null, null, fn);
    t.equal(size(a._listeningTo), 0);
    t.end();
});

test('listenTo and stopListening cleaning up references', function (t) {
    t.plan(2);
    var a = assign({}, Events);
    var b = assign({}, Events);
    a.listenTo(b, 'all', function () { t.ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'other', function () { t.ok(false); });
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    t.equal(keys(a._listeningTo).length, 0);
    t.end();
});

test('listenTo with empty callback doesn\'t throw an error', function (t) {
    t.plan(1);
    var e = assign({}, Events);
    e.listenTo(e, 'foo', null);
    e.trigger('foo');
    t.ok(true);
    t.end();
});

test('trigger all for each event', function (t) {
    t.plan(3);
    var a, b, obj = { counter: 0 };
    assign(obj, Events);
    obj.on('all', function(event) {
        obj.counter++;
        if (event == 'a') a = true;
        if (event == 'b') b = true;
    })
    .trigger('a b');
    t.ok(a);
    t.ok(b);
    t.equal(obj.counter, 2);
    t.end();
});

test('on, then unbind all functions', function (t) {
    t.plan(1);
    var obj = { counter: 0 };
    assign(obj,Events);
    var callback = function () { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    t.equal(obj.counter, 1, 'counter should have only been incremented once.');
    t.end();
});

test('bind two callbacks, unbind only one', function (t) {
    t.plan(2);
    var obj = { counterA: 0, counterB: 0 };
    assign(obj,Events);
    var callback = function () { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function () { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    t.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    t.equal(obj.counterB, 2, 'counterB should have been incremented twice.');
    t.end();
});

test('unbind a callback in the midst of it firing', function (t) {
    t.plan(1);
    var obj = {counter: 0};
    assign(obj, Events);
    var callback = function () {
        obj.counter += 1;
        obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    t.equal(obj.counter, 1, 'the callback should have been unbound.');
    t.end();
});

test('two binds that unbind themeselves', function (t) {
    t.plan(2);
    var obj = { counterA: 0, counterB: 0 };
    assign(obj,Events);
    var incrA = function () { obj.counterA += 1; obj.off('event', incrA); };
    var incrB = function () { obj.counterB += 1; obj.off('event', incrB); };
    obj.on('event', incrA);
    obj.on('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    t.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    t.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
    t.end();
});

test('bind a callback with a supplied context', function (t) {
    t.plan(1);
    var TestClass = function () {
        return this;
    };
    TestClass.prototype.assertTrue = function () {
        t.ok(true, '`this` was bound to the callback');
    };

    var obj = assign({},Events);
    obj.on('event', function () { this.assertTrue(); }, (new TestClass()));
    obj.trigger('event');
    t.end();
});

test('nested trigger with unbind', function (t) {
    t.plan(1);
    var obj = { counter: 0 };
    assign(obj, Events);
    var incr1 = function () { obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    var incr2 = function () { obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    t.equal(obj.counter, 3, 'counter should have been incremented three times');
    t.end();
});

test('callback list is not altered during trigger', function (t) {
    t.plan(2);
    var counter = 0, obj = assign({}, Events);
    var incr = function () { counter++; };
    obj.on('event', function () { obj.on('event', incr).on('all', incr); })
    .trigger('event');
    t.equal(counter, 0, 'bind does not alter callback list');
    obj.off()
    .on('event', function () { obj.off('event', incr).off('all', incr); })
    .on('event', incr)
    .on('all', incr)
    .trigger('event');
    t.equal(counter, 2, 'unbind does not alter callback list');
    t.end();
});

test('#1282 - `all` callback list is retrieved after each event.', function (t) {
    t.plan(1);
    var counter = 0;
    var obj = assign({}, Events);
    var incr = function () { counter++; };
    obj.on('x', function () {
        obj.on('y', incr).on('all', incr);
    })
    .trigger('x y');
    t.strictEqual(counter, 2);
    t.end();
});

test('if no callback is provided, `on` is a noop', function (t) {
    t.plan(0);
    assign({}, Events).on('test').trigger('test');
    t.end();
});

test('if callback is truthy but not a function, `on` should throw an error just like jQuery', function (t) {
    t.plan(1);
    var view = assign({}, Events).on('test', 'noop');
    t.throws(function () {
        view.trigger('test');
    });
    t.end();
});

test('remove all events for a specific context', function (t) {
    t.plan(4);
    var obj = assign({}, Events);
    obj.on('x y all', function () { t.ok(true); });
    obj.on('x y all', function () { t.ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
    t.end();
});

test('remove all events for a specific callback', function (t) {
    t.plan(4);
    var obj = assign({}, Events);
    var success = function () { t.ok(true); };
    var fail = function () { t.ok(false); };
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
    t.end();
});

test('#1310 - off does not skip consecutive events', function (t) {
    t.plan(0);
    var obj = assign({}, Events);
    obj.on('event', function () {
        t.ok(false);
    }, obj);
    obj.on('event', function () {
        t.ok(false);
    }, obj);
    obj.off(null, null, obj);
    obj.trigger('event');
    t.end();
});

test('once', function (t) {
    t.plan(2);
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = { counterA: 0, counterB: 0 };
    assign(obj, Events);
    var incrA = function () { obj.counterA += 1; obj.trigger('event'); };
    var incrB = function () { obj.counterB += 1; };
    obj.once('event', incrA);
    obj.once('event', incrB);
    obj.trigger('event');
    t.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    t.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
    t.end();
});

test('once variant one', function (t) {
    t.plan(3);
    var f = function () { t.ok(true); };

    var a = assign({}, Events).once('event', f);
    var b = assign({}, Events).on('event', f);

    a.trigger('event');

    b.trigger('event');
    b.trigger('event');
    t.end();
});

test('once variant two', function (t) {
    t.plan(3);
    var f = function () { t.ok(true); };
    var obj = assign({}, Events);

    obj
        .once('event', f)
        .on('event', f)
        .trigger('event')
        .trigger('event');
        t.end();
});

test('once with off', function (t) {
    t.plan(0);
    var f = function () { t.ok(true); };
    var obj = assign({}, Events);

    obj.once('event', f);
    obj.off('event', f);
    obj.trigger('event');
    t.end();
});

test('once with event maps', function (t) {
    var obj = { counter: 0 };
    assign(obj, Events);

    var increment = function () {
        this.counter += 1;
    };

    obj.once({
        a: increment,
        b: increment,
        c: increment
    }, obj);

    obj.trigger('a');
    t.equal(obj.counter, 1);

    obj.trigger('a b');
    t.equal(obj.counter, 2);

    obj.trigger('c');
    t.equal(obj.counter, 3);

    obj.trigger('a b c');
    t.equal(obj.counter, 3);
    t.end();
});

test('once with off only by context', function (t) {
    t.plan(0);
    var context = {};
    var obj = assign({}, Events);
    obj.once('event', function () { t.ok(false); }, context);
    obj.off(null, null, context);
    obj.trigger('event');
    t.end();
});

test('once with asynchronous events', function (t) {
    t.plan(1);
    var func = debounce(function () { t.ok(true); t.end(); }, 50);
    var obj = assign({}, Events).once('async', func);

    obj.trigger('async');
    obj.trigger('async');
});

test('once with multiple events.', function (t) {
    t.plan(2);
    var obj = assign({}, Events);
    obj.once('x y', function () { t.ok(true); });
    obj.trigger('x y');
    t.end();
});

test('Off during iteration with once.', function (t) {
    t.plan(2);
    var obj = assign({}, Events);
    var f = function () { this.off('event', f); };
    obj.on('event', f);
    obj.once('event', function () {});
    obj.on('event', function () { t.ok(true); });

    obj.trigger('event');
    obj.trigger('event');
    t.end();
});

test('`once` on `all` should work as expected', function (t) {
    t.plan(1);
    var thing = assign({}, Events);
    thing.once('all', function () {
        t.ok(true);
        thing.trigger('all');
    });
    thing.trigger('all');
    t.end();
});

test('once without a callback is a noop', function (t) {
    t.plan(0);
    assign({}, Events).once('event').trigger('event');
    t.end();
});

test('event functions are chainable', function (t) {
    var obj = assign({}, Events);
    var obj2 = assign({}, Events);
    var fn = function () {};
    t.equal(obj, obj.trigger('noeventssetyet'));
    t.equal(obj, obj.off('noeventssetyet'));
    t.equal(obj, obj.stopListening('noeventssetyet'));
    t.equal(obj, obj.on('a', fn));
    t.equal(obj, obj.once('c', fn));
    t.equal(obj, obj.trigger('a'));
    t.equal(obj, obj.listenTo(obj2, 'a', fn));
    t.equal(obj, obj.listenToOnce(obj2, 'b', fn));
    t.equal(obj, obj.off('a c'));
    t.equal(obj, obj.stopListening(obj2, 'a'));
    t.equal(obj, obj.stopListening());
    t.end();
});

test('listenToAndRun', function (t) {
    var count = 0;
    var a = assign({}, Events);
    var b = assign({}, Events);
    var result = a.listenToAndRun(b, 'all', function () {
        count++;
        t.equal(this, a, 'context should always be `a`');
    });

    t.equal(result, a, 'should return object');
    t.equal(count, 1, 'should have been called right away');
    b.trigger('anything');
    t.equal(count, 2, 'should have been called when triggered');
    t.equal(keys(a._listeningTo).length, 1, 'should have one object being listened to.');

    // stop it all
    a.stopListening();

    // trigger to see
    b.trigger('anything');
    t.equal(count, 2, 'should not have triggered again');
    t.equal(keys(a._listeningTo).length, 0, 'should have no objects being listened to.');

    t.end();
});

test('createEmitter', function (t) {
    t.ok(Events.createEmitter().on, 'can create new empty emitters');

    var myObj = {};
    Events.createEmitter(myObj);

    t.ok(myObj.on, 'adds event methods to existing objects if passed');

    t.end();
});
